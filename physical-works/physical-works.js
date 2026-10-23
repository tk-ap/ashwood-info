(function () {
  "use strict";

  // Room filters: hide pieces that do not belong to the selected room.
  var roomButtons = Array.prototype.slice.call(document.querySelectorAll(".pw-rooms button"));
  var pieces = Array.prototype.slice.call(document.querySelectorAll(".pw-piece"));
  roomButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var room = button.getAttribute("data-room");
      roomButtons.forEach(function (b) {
        b.setAttribute("aria-pressed", b === button ? "true" : "false");
      });
      pieces.forEach(function (piece) {
        var rooms = (piece.getAttribute("data-rooms") || "").split(/\s+/);
        piece.hidden = room !== "all" && rooms.indexOf(room) === -1;
      });
    });
  });

  // Piece detail sheet: one dialog, filled from the embedded public data.
  var dataEl = document.getElementById("pwData");
  if (!dataEl) return;
  var data;
  try {
    data = JSON.parse(dataEl.textContent);
  } catch (e) {
    return;
  }
  var sheet = document.getElementById("pwSheet");
  var img = document.getElementById("pwSheetImg");
  var status = document.getElementById("pwSheetStatus");
  var title = document.getElementById("pwSheetTitle");
  var spec = document.getElementById("pwSheetSpec");
  var story = document.getElementById("pwSheetStory");
  var closeBtn = document.getElementById("pwSheetClose");
  var lastFocus = null;

  function specRow(term, value) {
    if (!value) return "";
    var dt = document.createElement("dt");
    dt.textContent = term;
    var dd = document.createElement("dd");
    dd.textContent = value;
    var wrap = document.createElement("div");
    wrap.appendChild(dt);
    wrap.appendChild(dd);
    return wrap;
  }

  document.querySelectorAll(".pw-open").forEach(function (button) {
    button.addEventListener("click", function () {
      var piece = data[button.getAttribute("data-piece")];
      if (!piece || typeof sheet.showModal !== "function") return;
      lastFocus = button;
      img.src = piece.img;
      img.alt = piece.alt || "";
      status.textContent = piece.status || "";
      title.textContent = piece.title || "";
      spec.innerHTML = "";
      [specRow("Medium", piece.medium), specRow("Size", piece.size), specRow("State", piece.state)]
        .forEach(function (row) {
          if (row) spec.appendChild(row);
        });
      story.textContent = piece.story || "";
      sheet.showModal();
    });
  });

  closeBtn.addEventListener("click", function () {
    sheet.close();
  });
  sheet.addEventListener("click", function (event) {
    if (event.target === sheet) sheet.close();
  });
  sheet.addEventListener("close", function () {
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  });
})();
