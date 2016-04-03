//
// main JS for the training page.
//
define(['jquery'],
   function($) {
       $(function() {
           var players = [];

           // player init code
           function onPlayerReady(event) {
               var player = event.target;
               player.setPlaybackQuality('hd1080'); // Here we set the quality (yay!)  
               //event.target.playVideo(); // Optional. Means video autoplays  
           }

           // Youtube API ready event listener
           window.onYouTubeIframeAPIReady = function() {
               // instantiate a player for each element with class youtube-frame
               $('.youtube-frame').each(function(idx, el) {

                   if(! el.getAttribute('id')) {
                       el.setAttribute('id', 'iframe_'+idx);
                   }
                   var player = new YT.Player(el.getAttribute('id'), {
                       // ?? el.offsetWidth is 0 when this code runs, so we would
                       //    set our hidden players to minimum size, and only first
                       //     visible player is set up correctly
                       height: (el.offsetWidth/16)*9,
                       width: el.offsetWidth,
                       videoId: el.dataset.src,
                       events: {
                           'onReady': onPlayerReady
                       }
                   });
                   // TODO: if we store players inside dictionary or an object,
                   //       we could easily access each single player instance
                   players.push(player);
               });
           }

           // load youtube api script
           var tag = document.createElement('script');
           tag.src = "https://www.youtube.com/iframe_api";
           var firstScriptTag = document.getElementsByTagName('script')[0];
           firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

       });
   }
);
