import helloGif from '../assets/images/hello.gif'

const THEORY_HTML_ASSET_URLS: Record<string, string> = {
  '/theory_html/hello.png': helloGif,
  '/theory_html/hello.gif': helloGif,
}

export function resolveTheoryHtmlAssets(html: string): string {
  let resolved = html
  for (const [publicPath, assetUrl] of Object.entries(THEORY_HTML_ASSET_URLS)) {
    resolved = resolved.split(publicPath).join(assetUrl)
  }
  return resolved
}
