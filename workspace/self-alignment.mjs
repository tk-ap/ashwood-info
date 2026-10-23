// Original interpretive prompts — not attributed quotations or outcome predictions.
export const ALIGNMENT_LENSES = Object.freeze([
 {id:'overwhelmed', label:'Overwhelmed', thinker:'Alan Watts', work:'The Wisdom of Insecurity', idea:'You need not resolve an entire life today; begin with what is present and workable.', affirmation:'I can reduce scope without reducing the importance of my purpose.', question:'What truly needs my attention now?', action:'Choose one manageable commitment, or rest if rest is the immediate need.'},
 {id:'doubt', label:'Doubting myself', thinker:'Carl Jung', work:'Modern Man in Search of a Soul', idea:'An internal contradiction is something to examine rather than obey or suppress.', affirmation:'Uncertainty is not a verdict about my future.', question:'What is evidence, and what is an assumption?', action:'Write down one observable fact and one belief to revisit.'},
 {id:'wealth', label:'Wealth and values', thinker:'Erich Fromm', work:'To Have or to Be?', idea:'Consider what ownership makes possible and whether acquiring more supports the life you value.', affirmation:'I can receive prosperity without compromising my principles.', question:'Does this choice build genuine freedom and value without exploitation?', action:'Identify one ethical boundary in the next financial or product decision.'},
 {id:'stuck', label:'Unable to begin', thinker:'Miyamoto Musashi', work:'The Book of Five Rings', idea:'Skill emerges through attentive practice and precise engagement with the task at hand.', affirmation:'I can practice before I feel certain.', question:'What useful step matches my actual energy today?', action:'Finish one small unit of work, then reassess.'},
 {id:'creative', label:'Creatively distant', thinker:'Audre Lorde', work:'Sister Outsider — Uses of the Erotic: The Erotic as Power', idea:'Pleasure, feeling, and artistic energy can be meaningful knowledge, not productivity rewards.', affirmation:'Art and joy deserve time even while obligations remain.', question:'What would reconnect me with the act of experiencing rather than performing?', action:'Spend a few unmeasured minutes with a medium you love.'},
 {id:'teaching', label:'Seeking purpose', thinker:'Paulo Freire', work:'Pedagogy of the Oppressed', idea:'A practice of teaching can strengthen others’ independent judgment rather than provide fixed answers.', affirmation:'I can create value by widening another person’s agency.', question:'Does my work help people question and choose for themselves?', action:'Identify one way your next creation protects another person’s choice.'}
]);

export function alignmentLensFor(id) {
 return ALIGNMENT_LENSES.find(item => item.id === id) || ALIGNMENT_LENSES[0];
}
export function mountSelfAlignmentMirror(root = document) {
 const host = root.getElementById('self-alignment-mirror');
 if (!host) return;
 const buttons = [...host.querySelectorAll('[data-self-reset]')];
 const fields = Object.fromEntries(['thinker','work','idea','affirmation','question','action'].map(key => [key,host.querySelector('[data-mirror-' + key + ']')]));
 if (Object.values(fields).some(value=>!value)) return;
 function select(id) {
   const lens=alignmentLensFor(id);
   for (const key in fields) fields[key].textContent=lens[key];
   for (const button of buttons) button.setAttribute('aria-pressed',String(button.dataset.selfReset===lens.id));
 }
 buttons.forEach(button => button.addEventListener('click',()=>select(button.dataset.selfReset)));
 select('overwhelmed');
}


if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountSelfAlignmentMirror());
  else mountSelfAlignmentMirror();
}
