
function quoth()
{
  var n = Math.floor(Math.random() * quotes.length);
  quoteContent.innerHTML = "\"" + quotes[n].quotation +
                 "\"<BR>-<align=right>" + quotes[n].author + "</align>";
}


function setup(lastupdated, rcsfile)
{
    var t = document.getElementById("tab1");

    // Add header
    var r = t.insertRow(0);
    var rC = r.insertCell(0);
    rC.colSpan = "2";
    rC.height="122";
    rC.innerHTML = ""+
      "<table width=\"100%\" class=blacktable align=center cellspacing=10>"+
      "<tr><td>"+
      "<img height=188 src=images/tracey.jpg>"+
      "</td><td align=center>"+
      "<span class=big>Tracey Jaquith</span><br>"+
      "<img src=images/moo-dusk.gif><br>"+
      "<img src=images/DontSpamMe2.gif><br>"+
      "Software &amp; Video Geek<br>"+
      "</td><td>"+
      "<img src=images/dumb_bunny_sunset2_web_small.jpg></td>"+
      "<td><img height=188 src=images/traceyYahooAvatar.gif></td>"+
      "</tr></table>";

    // Add nav column to left of main row (ie: not header row, not footer row)
    var r = t.rows[1];
    var rC = r.insertCell(0);
    rC.vAlign="top";
    rC.className = "nav";
    rC.style.paddingLeft=10;
    rC.width="175";
    rC.innerHTML = ""+
      "<a href=index.htm>Home</a><br>"+
      "<a href=favorites.htm>Favorite:</a><br>&nbspMovies<br>&nbspBooks<br>&nbspMusic<br>"+
      "<a href=samples.htm>Time-lapse</a><br>&nbspPhotography<br>"+
      "<a href=pictures.htm>Pictures</a><br>"+
      "<a href=europe.htm>Europe Trip</a><br>"+
      "<a href=biking.htm>Biking</a><br>"+
      "<a href=video.htm>Video</a><br>"+
      "<a href=/resume>Resume</a><br>"+
      "<a href=work.htm>Work history</a><br>"+
      "<a href=quotes.htm>Quotes</a><br>"+
      "<a href=guestbook.htm>Guestbook</a><br>";

    // Swell the main content's width to fill table
    var r = t.rows[1];
    var rC = r.cells[1];
    rC.width="800";
    rC.vAlign = "top";


    // Add footer
    var r = t.insertRow(t.rows.length);
    var rC = r.insertCell(r.cells.length);
    rC.innerHTML =
      "<i>Copyright 2004 Dumb Bunny Productions&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
      "Page last updated:&nbsp;&nbsp;" + lastupdated.substr(7,10) + "</i>";
    rC.colSpan = "2";
    rC.vAlign = "center";
    rC.align = "center";
    rC.height = 40;



    // Now do any custom per-page loading as necessary
    var curpage = rcsfile.substr(10); // nix lead "$RCSfile: "
    var t=curpage.split(",")[0]; // nix trail ",v $"
    window.status="Currently at: "+t;
    if (t == "europe.htm")
    {
      // this is here so this can be loaded LAST (by being done in "onLoad")
      tframe.location="http://photos.yahoo.com/ph/tracey_pooh/album?.dir=/4fd6";
    }
    else if (t == "guestbook.htm")
    {
      tframe.location = "http://us.geocities.yahoo.com/gb/view?member=tracey_pooh";
    }
}
