<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
 xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:fo="http://www.w3.org/1999/XSL/Format">

  <xsl:output method="html"/>
  <xsl:template match="/">


<html>
<head>
<title>chez Tracey Jaquith</title>
<style>


/* default styles for all pages unless override */
A:link, A:visited { color: cyan; text-decoration: none; }
A:active, A:hover { color: cyan; text-decoration: underline; }
/* default table style (so defaults for all pages, too, essentially 8-) */
table
{
  background: #000055;
  color: yellow;
  font: normal 12px Verdana, Arial, Helvetica;
}


.blacktable
{
  background: black;
  color: yellow;
  font: normal 12px Verdana, Arial, Helvetica;
}


/* tile a smurfy background */
body
{
  background: url('cloudtile.jpg') repeat; text-align:center;
}





/* navigation styles */
.nav { font: bold 15px Verdana, Arial, Helvetica; }
.nav A:link, .nav A:visited { line-height:200%; color: yellow; text-decoration: none; }
.nav A:active, .nav A:hover { line-height:200%; color: #D6270A; font: bold; text-transform: uppercase; }


/* text emphasis styles */
.f1 { background: #D6270A; border: solid 1px #853126; color: #ffffff; font: bold 14px Verdana, Arial, Helvetica }
.f2 { color: #D6270A; font: bold 15px Verdana, Arial, Helvetica }
.f3 { color: #D6270A; font: bold 13px Verdana, Arial, Helvetica }
.f4 { color: #D6270A; font: bold italic 13px Verdana, Arial, Helvetica }
.f5 { color: #D6270A; font: bold 11px Verdana, Arial, Helvetica }
.f6 { color: #D6270A; font: bold italic 11px Verdana, Arial, Helvetica }


.big { font: 20px; }

</style>
</head>

<body>


<table style="height:100%; width:975; border-collapse:collapse; border:0;">
  <tr><td colspan="2" height="122">
    <!--header-->
    <table width="100%" class="blacktable" align="center" cellspacing="10">
      <tr>
      <td>
        <img height="188" src="images/tracey.jpg"/>
      </td>
      <td align="center">
        <span class="big">Tracey Jaquith</span><br/>
        <img src="images/moo-dusk.gif"/><br/>
        <img src="images/DontSpamMe2.gif"/><br/>
        Software &amp; Video Geek<br/>
      </td>
      <td>
        <img src="images/dumb_bunny_sunset2_web_small.jpg"/>
      </td>
      <td>
        <img height="188" src="images/traceyYahooAvatar.gif"/>
      </td>
      </tr>
    </table>
  </td></tr>

  <!-- lefthand navigation-->
  <tr>
    <td style="width:175; paddingLeft:30" class="nav" valign="top">
      <a href="index.xml">Home</a><br/>
      <a href="favorites.xml">Favorite:</a><br/><xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>Movies<br/><xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>Books<br/><xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>Music<br/>
      <a href="samples.xml">Time-lapse</a><br/><xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>Photography<br/>
      <a href="pictures.xml">Pictures</a><br/>
      <a href="europe.xml">Europe Trip</a><br/>
      <a href="biking.xml">Biking</a><br/>
      <a href="video.xml">Video</a><br/>
      <a href="resume">Resume</a><br/>
      <a href="work.xml">Work history</a><br/>
      <a href="quotes.xml">Quotes</a><br/>
      <a href="guestbook.xml">Guestbook</a><br/>
    </td>

    <!--drop in actual page contents, woot!! -->
    <td align="left" valign="top" width="800">
      <xsl:value-of select="tracey/content" disable-output-escaping="yes"/>
    </td>
  </tr>
  <!--footer-->
  <tr>
    <td colspan="2" align="center" valign="center" height="40">
      <i>Copyright 2004 Dumb Bunny Productions
          <xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
          <xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
          <xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
          <xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
          <xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
          <xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
          <xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
          <xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
          <xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
          Page last updated:
          <xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
          <xsl:text disable-output-escaping="yes">&amp;nbsp;</xsl:text>
          <xsl:value-of select="tracey/lastmod"/>
      </i>
    </td>
  </tr>
</table>

</body>
</html>
</xsl:template>
</xsl:stylesheet>
