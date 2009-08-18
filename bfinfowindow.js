/* BFInfoWindow mimics the InfoWindow class found Google Maps API v3 but allows
 * the user to define their own info window styles.
 * @author  Peter Robinett, peter@bubblefoundry.com
 * @version 0.1
 */

/* An BFInfoWindow is like an info window, but it displays under the marker,
 * opens quicker, and has flexible styling. Overload its createElement to style the info window.
 * @param {InfoWindowOptions} options An options object
 */
function BFInfoWindow(options) {
  google.maps.OverlayView.call(this);
  this.offsetVertical_ = -195;
  this.offsetHorizontal_ = 0;
  this.height_ = 165;
  this.width_ = 266;

  // Once the properties of this OverlayView are initialized, set its map so
  // that we can display it.  This will trigger calls to panes_changed and
  // draw.
  this.set_map(this.map_);
  
  // MVCObject's set methods give errors if not called after set_map here
  this.setOptions(options);
}

/* BFInfoWindow extends OverlayView class from the Google Maps v3 API
 */
BFInfoWindow.prototype = new google.maps.OverlayView();

/*
 * @param {Map} map The map to which the BFInfoWindow shall belong.
 * @param {MVCObject} anchor  The MVCObject having a position property to which
 * the BFInfoWindow shall be attached to.
 */
BFInfoWindow.prototype.open = function(map, anchor) {
  this.set_location(anchor.position);
  this.latlng_ = this.get_location();
  this.map_ = map;
  
  var self = this;
  
  this.boundsChangedListener_ =
    google.maps.event.addListener(this.map_, "bounds_changed", function() {
      return self.panMap.apply(self);
    });

  // Once the properties of this OverlayView are initialized, set its map so
  // that we can display it.  This will trigger calls to panes_changed and
  // draw.
  this.set_map(this.map_);
};
BFInfoWindow.prototype.close = function() {
  this.set_map(null);
};
BFInfoWindow.prototype.setOptions = function(options) {
  this.setValues(options);
};
BFInfoWindow.prototype.set_content = function(content) {
  this.set("content", content);
};

/*
 * @return {string|Node}  Returns the content of the BFInfoWindow.
 * @see InfoWindow
 * @see MVCObject
 */
BFInfoWindow.prototype.get_content = function() {
  return this.get("content");
};

/*
 * @param {LatLng} location The location to which the BFInfoWindow should be anchored.
 * @see InfoWindow
 */
BFInfoWindow.prototype.set_location = function(location) {
  this.set("location", location);
};

/*
 * @return {LatLng}  Returns the anchor location of the BFInfoWindow.
 * @see InfoWindow
 * @see MVCObject
 */
BFInfoWindow.prototype.get_location = function() {
  return this.get("location");
};

/*
 * @param {number} zIndex Sets the z-index of the BFInfoWindow.
 * @see InfoWindow
 */
BFInfoWindow.prototype.set_zIndex = function(zIndex) {
  this.set("zIndex", zIndex);
};

/*
 * @return {number}  Returns the z-index of the BFInfoWindow.
 * @see InfoWindow
 * @see MVCObject
 */
BFInfoWindow.prototype.get_zIndex = function() {
  return this.get("zIndex");
};

/* Removes the DIV representing this BFInfoWindow
 */
BFInfoWindow.prototype.remove = function() {
  if (this.div_) {
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  }
};

/* Redraws the BFInfoWindow based on the current projection and zoom level
 */
BFInfoWindow.prototype.draw = function() {
  // Creates the element if it doesn't exist already.
  this.createElement();
  if (!this.div_) return;

  // Calculate the DIV coordinates of two opposite corners of our bounds to
  // get the size and position of our BFInfoWindow
  var pixPosition = this.get_projection().fromLatLngToDivPixel(this.latlng_);
  if (!pixPosition) return;

  // Now position our DIV based on the DIV coordinates of our bounds
  this.div_.style.width = this.width_ + "px";
  this.div_.style.left = (pixPosition.x + this.offsetHorizontal_) + "px";
  this.div_.style.height = this.height_ + "px";
  this.div_.style.top = (pixPosition.y + this.offsetVertical_) + "px";
  this.div_.style.display = 'block';
};

/* Creates the DIV representing this BFInfoWindow in the floatPane.  If the panes
 * object, retrieved by calling get_panes, is null, remove the element from the
 * DOM.  If the div exists, but its parent is not the floatPane, move the div
 * to the new pane.
 * Called from within draw.  Alternatively, this can be called specifically on
 * a panes_changed event.
 */
BFInfoWindow.prototype.createElement = function() {
  var panes = this.get_panes();
  var div = this.div_;
  if (!div) {
    // This does not handle changing panes.  You can set the map to be null and
    // then reset the map to move the div.
    div = this.div_ = document.createElement("div");
    div.style.border = "0px none";
    div.style.position = "absolute";
    div.style.background = "url('http://gmaps-samples.googlecode.com/svn/trunk/images/blueinfowindow.gif')";
    div.style.width = this.width_ + "px";
    div.style.height = this.height_ + "px";
    div.style.zIndex = this.get_zIndex();
    var contentDiv = document.createElement("div");
    contentDiv.style.padding = "30px"
    contentDiv.innerHTML = this.get_content();

    var topDiv = document.createElement("div");
    topDiv.style.textAlign = "right";
    var closeImg = document.createElement("img");
    closeImg.style.width = "32px";
    closeImg.style.height = "32px";
    closeImg.style.cursor = "pointer";
    closeImg.src = "http://gmaps-samples.googlecode.com/svn/trunk/images/closebigger.gif";
    topDiv.appendChild(closeImg);

    google.maps.event.addDomListener(closeImg, 'click', this.removeBFInfoWindow(this));

    div.appendChild(topDiv);
    div.appendChild(contentDiv);
    div.style.display = 'none';
    panes.floatPane.appendChild(div);
    this.panMap();
  } else if (div.parentNode != panes.floatPane) {
    // The panes have changed.  Move the div.
    div.parentNode.removeChild(div);
    panes.floatPane.appendChild(div);
  } else {
    // The panes have not changed, so no need to create or move the div.
  }
};

BFInfoWindow.prototype.removeBFInfoWindow = function(ib) {
  return function() {
    ib.set_map(null);
  };
};

/* Pan the map to fit the BFInfoWindow.
 */
BFInfoWindow.prototype.panMap = function() {
  // if we go beyond map, pan map
  var map = this.map_;
  var bounds = map.get_bounds();
  if (!bounds) return;

  // The position of the infowindow
  var position = this.latlng_;

  // The dimension of the infowindow
  var iwWidth = this.width_;
  var iwHeight = this.height_;

  // The offset position of the infowindow
  var iwOffsetX = this.offsetHorizontal_;
  var iwOffsetY = this.offsetVertical_;

  // Padding on the infowindow
  var padX = 40;
  var padY = 40;

  // The degrees per pixel
  var mapDiv = map.getDiv();
  var mapWidth = mapDiv.offsetWidth;
  var mapHeight = mapDiv.offsetHeight;
  var boundsSpan = bounds.toSpan();
  var longSpan = boundsSpan.lng();
  var latSpan = boundsSpan.lat();
  var degPixelX = longSpan / mapWidth;
  var degPixelY = latSpan / mapHeight;

  // The bounds of the map
  var mapWestLng = bounds.getSouthWest().lng();
  var mapEastLng = bounds.getNorthEast().lng();
  var mapNorthLat = bounds.getNorthEast().lat();
  var mapSouthLat = bounds.getSouthWest().lat();

  // The bounds of the infowindow
  var iwWestLng = position.lng() + (iwOffsetX - padX) * degPixelX;
  var iwEastLng = position.lng() + (iwOffsetX + iwWidth + padX) * degPixelX;
  var iwNorthLat = position.lat() - (iwOffsetY - padY) * degPixelY;
  var iwSouthLat = position.lat() - (iwOffsetY + iwHeight + padY) * degPixelY;

  // calculate center shift
  var shiftLng =
      (iwWestLng < mapWestLng ? mapWestLng - iwWestLng : 0) +
      (iwEastLng > mapEastLng ? mapEastLng - iwEastLng : 0);
  var shiftLat =
      (iwNorthLat > mapNorthLat ? mapNorthLat - iwNorthLat : 0) +
      (iwSouthLat < mapSouthLat ? mapSouthLat - iwSouthLat : 0);

  // The center of the map
  var center = map.get_center();

  // The new map center
  var centerX = center.lng() - shiftLng;
  var centerY = center.lat() - shiftLat;

  // center the map to the new shifted center
  map.set_center(new google.maps.LatLng(centerY, centerX));

  // Remove the listener after panning is complete.
  google.maps.event.removeListener(this.boundsChangedListener_);
  this.boundsChangedListener_ = null;
};