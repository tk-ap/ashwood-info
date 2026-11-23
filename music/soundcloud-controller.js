(() => {
  "use strict";

  function connectSoundCloud(frame, onReady) {
    const createWidget = window.SC?.Widget;
    if (!frame || !createWidget) return null;
    const widget = createWidget(frame);
    const events = createWidget.Events;
    const media = new EventTarget();
    const emit = name => media.dispatchEvent(new Event(name));

    let selected = null;
    let duration = 0;
    let position = 0;
    let volume = 0.8;
    let wanted = false;
    let paused = true;
    let ended = false;
    let confirmed = false;
    let pendingSeek = 0;
    let request = 0;
    let previousIndex = null;
    let registered = false;

    const updatePosition = ({ currentPosition }) => {
      if (!wanted || !confirmed || !Number.isFinite(currentPosition)) return;
      position = currentPosition / 1000;
      emit("timeupdate");
    };

    Object.defineProperties(media, {
      paused: { get: () => paused },
      ended: { get: () => ended },
      duration: { get: () => duration },
      currentTime: {
        get: () => position,
        set: seconds => {
          position = pendingSeek = Math.max(0, Math.min(duration || seconds, seconds));
          if (confirmed) widget.seekTo(Math.round(position * 1000));
        }
      },
      volume: {
        get: () => volume,
        set: value => {
          volume = value;
          widget.setVolume(Math.round(value * 100));
          emit("volumechange");
        }
      }
    });

    media.select = (track, start) => {
      request++;
      selected = track.index;
      duration = track.duration;
      position = pendingSeek = start;
      paused = true;
      ended = false;
      confirmed = false;
      wanted = false;
    };

    media.play = async () => {
      if (selected === null) return;
      wanted = true;
      ended = false;
      const intent = ++request;
      if (previousIndex !== selected) {
        widget.skip(selected);
        confirmed = false;
      }
      widget.play();
      window.setTimeout(() => {
        if (request !== intent || !wanted || !paused) return;
        wanted = false;
        widget.pause();
        emit("error");
      }, 6000);
    };

    media.pause = () => {
      if (!wanted && paused) return;
      request++;
      wanted = false;
      paused = true;
      pendingSeek = position;
      widget.pause();
      emit("pause");
    };

    widget.bind(events.READY, () => {
      widget.getSounds(sounds => {
        const tracks = (sounds || []).flatMap((sound, index) => {
          if (!sound.title || sound.streamable === false) return [];
          return [{
            id: `soundcloud-${sound.id ?? index}`,
            title: sound.title,
            artist: sound.user?.username || "t.kap",
            artwork: sound.artwork_url || sound.user?.avatar_url || "",
            dspUrl: sound.permalink_url || "https://soundcloud.com/tk-ap/sets/sounds-of-t-kap",
            duration: (Number(sound.duration) || 0) / 1000,
            index,
            controller: media,
            source: true
          }];
        });
        if (tracks.length) { registered = true; onReady(tracks); }
      });
    });
    widget.bind(events.PLAY, () => {
      if (!registered) return;
      const intent = request;
      widget.getCurrentSoundIndex(index => {
        previousIndex = index;
        if (intent !== request) return;
        if (!wanted || index !== selected) {
          widget.pause();
          return;
        }
        paused = false;
        if (!confirmed) widget.seekTo(Math.round(pendingSeek * 1000));
        confirmed = true;
        widget.getDuration(ms => {
          if (request !== intent || !Number.isFinite(ms) || ms <= 0) return;
          duration = ms / 1000;
          emit("timeupdate");
        });
        emit("play");
      });
    });
    widget.bind(events.PAUSE, () => {
      if (!confirmed || paused) return;
      paused = true;
      emit("pause");
    });
    widget.bind(events.PLAY_PROGRESS, updatePosition);
    widget.bind(events.FINISH, () => {
      if (!wanted || !confirmed) return;
      paused = true;
      ended = true;
      wanted = false;
      confirmed = false;
      emit("ended");
    });
    widget.bind(events.ERROR, () => {
      if (!wanted) return;
      wanted = false;
      paused = true;
      emit("error");
    });
    return media;
  }

  window.connectAshwoodSoundCloud = connectSoundCloud;
})();
