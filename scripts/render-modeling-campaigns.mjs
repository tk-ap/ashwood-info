// Static campaign component: generated HTML remains usable without JavaScript.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const campaigns = JSON.parse(readFileSync(new URL('modeling/campaigns.json', root), 'utf8'));
const escape = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function renderCampaign(campaign) {
  const { id, index, location, name, titleLines, intro, credit, photographerUrl, photographerLabel, brandUrl, brandLabel, images } = campaign;
  return `      <section id="${escape(id)}" class="feature-section section-shell" aria-labelledby="${escape(id)}-title">
        <div class="section-kicker"><span>${escape(index)}</span><span>${escape(location)}</span></div>
        <div class="feature-heading">
          <h2 id="${escape(id)}-title" class="outline-title">${titleLines.map(escape).join('<br>')}</h2>
          <div class="feature-intro"><p>${escape(intro)}</p>${credit ? `<p class="credit">${escape(credit)}${photographerUrl ? ` <a href="${escape(photographerUrl)}" target="_blank" rel="noopener">${escape(photographerLabel)} ↗</a>` : ''}</p>` : ''}${brandUrl ? `<p class="credit"><a href="${escape(brandUrl)}" target="_blank" rel="noopener">${escape(brandLabel)} ↗</a></p>` : ''}</div>
        </div>
        <div class="campaign-grid" aria-label="${escape(name)} campaign images">
${images.map((img, i) => `          <div class="${escape(img.frameClass || 'asset-frame')}"><img src="${escape(img.src)}" alt="${escape(img.alt)}"${img.width ? ` width="${img.width}" height="${img.height}"` : ''} loading="${i === 0 ? 'eager' : 'lazy'}" /></div>`).join('\n')}
        </div>
      </section>`;
}
const path = fileURLToPath(new URL('modeling/index.html', root));
const current = readFileSync(path, 'utf8');
const output = current.replace(/      <!-- campaigns:start -->[\s\S]*?      <!-- campaigns:end -->/, `      <!-- campaigns:start -->\n${campaigns.map(renderCampaign).join('\n\n')}\n      <!-- campaigns:end -->`);
if (process.argv.includes('--check')) {
  if (output !== current) throw new Error('Campaign HTML is stale. Run node scripts/render-modeling-campaigns.mjs');
} else writeFileSync(path, output);
