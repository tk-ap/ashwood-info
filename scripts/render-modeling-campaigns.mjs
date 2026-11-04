// Static campaign component: generated HTML remains usable without JavaScript.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const campaigns = JSON.parse(readFileSync(new URL('modeling/campaigns.json', root), 'utf8'));
const escape = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function renderCampaign(campaign) {
  const { id, index, location, name, titleLines, intro, creditLabel, creditName, photographerUrl, photographerLabel, brandUrl, brandLabel, websiteUrl, websiteLabel, headerStyle, images } = campaign;
  const title = headerStyle === 'barelysain'
    ? readFileSync(new URL('assets/brand-marks/barelysain-garment.svg', root), 'utf8').trim()
    : titleLines.map(line => `<span>${escape(line)}</span>`).join('<br>');
  return `      <section id="${escape(id)}" class="feature-section section-shell" aria-labelledby="${escape(id)}-title">
        <div class="section-kicker"><span>${escape(index)}</span><span>${escape(location)}</span></div>
        <div class="feature-heading">
          <h2 id="${escape(id)}-title" class="outline-title campaign-wordmark campaign-wordmark--${escape(headerStyle || 'editorial')}" aria-label="${escape(name)}">${title}</h2>
          <div class="feature-intro">
            <p>${escape(intro)}</p>
            <dl class="campaign-credits">
              <div><dt>${escape(creditLabel)}</dt><dd><a href="${escape(photographerUrl)}" target="_blank" rel="noopener">${escape(creditName)} · ${escape(photographerLabel)} ↗</a></dd></div>
              <div><dt>Brand</dt><dd><a href="${escape(brandUrl)}" target="_blank" rel="noopener">${escape(brandLabel)} ↗</a>${websiteUrl ? `<a href="${escape(websiteUrl)}" target="_blank" rel="noopener">${escape(websiteLabel)} ↗</a>` : ''}</dd></div>
            </dl>
          </div>
        </div>
        <div class="campaign-grid" aria-label="${escape(name)} campaign images">
${images.map((img, i) => {
  const responsive = img.sources ? ` srcset="${img.sources.map(source => `${escape(source.src)} ${source.width}w`).join(', ')}" sizes="${i === 0 ? '(max-width: 700px) calc(100vw - 36px), min(94vw, 1540px)' : '(max-width: 700px) calc(100vw - 36px), min(46vw, 756px)'}" data-full-src="${escape(img.fullSrc)}" decoding="async" fetchpriority="${i === 0 ? 'high' : 'low'}"` : '';
  return `          <div class="${escape(img.frameClass || 'asset-frame')}"><img src="${escape(img.src)}" alt="${escape(img.alt)}"${img.width ? ` width="${img.width}" height="${img.height}"` : ''}${responsive} loading="${img.sources || i === 0 ? 'eager' : 'lazy'}" /></div>`;
}).join('\n')}
        </div>
      </section>`;
}
const path = fileURLToPath(new URL('modeling/index.html', root));
const current = readFileSync(path, 'utf8');
const output = current.replace(/      <!-- campaigns:start -->[\s\S]*?      <!-- campaigns:end -->/, `      <!-- campaigns:start -->\n${campaigns.map(renderCampaign).join('\n\n')}\n      <!-- campaigns:end -->`);
if (process.argv.includes('--check')) {
  if (output !== current) throw new Error('Campaign HTML is stale. Run node scripts/render-modeling-campaigns.mjs');
} else writeFileSync(path, output);
