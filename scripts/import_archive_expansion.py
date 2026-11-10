import hashlib, io, json, pathlib, urllib.request
from PIL import Image, ImageOps
root=pathlib.Path(__file__).resolve().parents[1]
items=json.loads((root/'scripts/archive-expansion-import.json').read_text())
assert len(items)==19
for r in items:
    assert r['sourceUrl'].startswith('https://cdn.myportfolio.com/03dd04c4-bb6b-4236-b8fb-0f46a591f405/')
    with urllib.request.urlopen(r['sourceUrl'],timeout=40) as response:
        data=response.read(20*1024*1024)
    assert hashlib.sha256(data).hexdigest()==r['sourceSha256'],r['id']
    im=ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert('RGB')
    assert im.size==(r['width'],r['height'])
    clean=Image.new('RGB',im.size);clean.paste(im)
    target=root/r['path'].lstrip('/');target.parent.mkdir(parents=True,exist_ok=True)
    clean.save(target,quality=95,subsampling=0)
    web=clean.copy();web.thumbnail((1600,1600))
    web.save(root/r['deliveryPath'].lstrip('/'),'WEBP',quality=84,method=6)
    assert not Image.open(target).getexif()
print('Verified 19 reviewed source hashes, dimensions, original/delivery pairs and EXIF removal.')
