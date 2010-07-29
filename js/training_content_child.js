// everything is wrapped in the XD function to reduce namespace collisions
var XD = function(){

    var interval_id,
    last_hash,
    cache_bust = 1,
    attached_callback,
    window = this;

    return {
        postMessage : function(message, target_url, target) {
            if (!target_url) {
                return;
            }
            target = target || parent;  // default to parent
            if (window['postMessage']) {
                // the browser supports window.postMessage, so call it with a targetOrigin
                // set appropriately, based on the target_url parameter.
                target['postMessage'](message, target_url.replace( /([^:]+:\/\/[^\/]+).*/, '$1'));
            } else if (target_url) {
                // the browser does not support window.postMessage, so use the window.location.hash fragment hack
                target.location = target_url.replace(/#.*$/, '') + '#' + (+new Date) + (cache_bust++) + '&' + message;
            }
        },
        receiveMessage : function(callback, source_origin) {
            // browser supports window.postMessage
            if (window['postMessage']) {
                // bind the callback to the actual event associated with window.postMessage
                if (callback) {
                    attached_callback = function(e) {
                        if ((typeof source_origin === 'string' && e.origin !== source_origin)
                        || (Object.prototype.toString.call(source_origin) === "[object Function]" && source_origin(e.origin) === !1)) {
                             return !1;
                         }
                         callback(e);
                     };
                 }
                 if (window['addEventListener']) {
                     window[callback ? 'addEventListener' : 'removeEventListener']('message', attached_callback, !1);
                 } else {
                     window[callback ? 'attachEvent' : 'detachEvent']('onmessage', attached_callback);
                 }
             } else {
                 // a polling loop is started & callback is called whenever the location.hash changes
                 interval_id && clearInterval(interval_id);
                 interval_id = null;
                 if (callback) {
                     interval_id = setInterval(function() {
                         var hash = document.location.hash,
                         re = /^#?\d+&/;
                         if (hash !== last_hash && re.test(hash)) {
                             last_hash = hash;
                             callback({data: hash.replace(re, '')});
                         }
                     }, 100);
                 }
             }
         }
    };
}();
// <iframe> dynamic resizing JS
// filename: training_content/js/training_content_child.js
// The first param is passed to the
// parent window. If window.postMessage exists, the param is passed using that,
// otherwise it is passed in the location hash (that's why parent_url is required).
// The second param is the targetOrigin.
// TODO: remove this file from the module - it should be included in the theme (facebook_child.js)
function setHeight() {
	// Gets the parent page URL as it was passed in, for browsers that don't support
  // window.postMessage (this URL could be hard-coded).
  var parent_url = decodeURIComponent( document.location.hash.replace( /^#/, '' ) );
  
	// Gets the height of the Quicktabs container
	var if_height = $('#quicktabs_container_trainingcontent').outerHeight(true);
	// Sends that to the parent iframe
  XD.postMessage(if_height, parent_url, parent );
};

function setLinks() {
	// for all links on urbansermons, rewrite to urbanministry so they work x-domain
	$('a[href^="http://www.urbansermons.org"]').each(function() {
		this.href = this.href.replace(/www\.urbansermons\.org/, 'www.urbanministry.org');
	});
	
	// for all links on urbanministry.org that are not the ajax tabs, add the location hash
	$('a[href^="http://www.urbanministry.org"]:not(.qt_ajax_tab)').each(function() {
		this.href = this.href.replace(/#(.*)/, '');
		this.href = this.href + '#' + encodeURIComponent( document.location.hash.replace( /^#/, '' ) ); 
	});
		
	// for all external links, rewrite to open in a new window or tab
	$('a[href]:not(a[href^="http://www.urbanministry.org"],a[href^="http://www.urbansermons.org"])').each(function() {																																																	
	  this.target = '_blank';																																																				 });																																																								
}

$(window).load(function(){
  // Now that the DOM has been set up (and the height should be set) invoke setHeight
	// Also set the links
  setHeight();
	setLinks();
	
  // Binds to Quicktabs list items so that iframe resizes when they are clicked
	// Do these in a setTimeout so it waits for the tab to load
  $('a.qt_ajax_tab').click(function() { 		
		setTimeout('setLinks()', 1500);
    setTimeout('setHeight()', 3000);
	});
});
