<?xml version="1.0" encoding="utf-8"?>
<!-- the whole "theme": wrap the post's text in an HTML shell & hand off to loader.js -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="utf-8" doctype-system="about:legacy-compat"/>
  <xsl:template match="/">
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>throwback</title>
        <style>
          body { max-width: 40em; margin: 2em auto; padding: 0 1em; font-family: Verdana, sans-serif; background: #ffc }
          #md  { white-space: pre-wrap }
        </style>
        <script type="module" src="loader.js"></script>
      </head>
      <body>
        <!-- fail open: no JS => you still read the markdown -->
        <pre id="md"><xsl:value-of select="/*"/></pre>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
