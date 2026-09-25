export default function handler(req,res){
  const url=process.env.LATEST_UNLAWFUL_DETAINER_PDF_URL;
  if(!url){
    res.statusCode=503;
    res.setHeader('content-type','text/plain; charset=utf-8');
    return res.end('Latest unlawful-detainer PDF has not been published to the workspace yet.');
  }
  res.statusCode=302;
  res.setHeader('location',url);
  res.setHeader('cache-control','no-store, max-age=0');
  return res.end();
}
