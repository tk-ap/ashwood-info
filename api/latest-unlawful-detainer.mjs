const LATEST_UD_PDF_URL = 'https://drive.google.com/file/d/17xoV4qzS6Tr0CA-kgWbfgo_MFVBYUa7b/view?usp=drivesdk';

export default function handler(req,res){
  res.statusCode=302;
  res.setHeader('location',LATEST_UD_PDF_URL);
  res.setHeader('cache-control','no-store, max-age=0');
  return res.end();
}
