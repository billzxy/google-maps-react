import React, {Fragment} from 'react'
import PropTypes from 'prop-types'

import { camelize } from '../lib/String'

const evtNames = [
  'click',
  'dblclick',
  'dragend',
  'mousedown',
  'mouseout',
  'mouseover',
  'mouseup',
  'recenter',
];

const wrappedPromise = function() {
    var wrappedPromise = {},
        promise = new Promise(function (resolve, reject) {
            wrappedPromise.resolve = resolve;
            wrappedPromise.reject = reject;
        });
    wrappedPromise.then = promise.then.bind(promise);
    wrappedPromise.catch = promise.catch.bind(promise);
    wrappedPromise.promise = promise;

    return wrappedPromise;
}

function isEquivalent(a, b) {
  if(!a || !b)
    return false;
  var aProps = Object.getOwnPropertyNames(a);
  var bProps = Object.getOwnPropertyNames(b);
  if (aProps.length != bProps.length) {
      return false;
  }

  for (var i = 0; i < aProps.length; i++) {
      var propName = aProps[i];
      if (a[propName] !== b[propName]) {
          return false;
      }
  }
  return true;
}

export class Marker extends React.Component {

  componentDidMount() {
    this.markerPromise = wrappedPromise();
    this.renderMarker();
  }

  componentDidUpdate(prevProps) {
    if(this.props.icon && !isEquivalent(this.props.icon, prevProps.icon) && this.props.icon.custom){
      this.marker.setIcon(this.props.icon);
    }
    if (!isEquivalent(this.props.map, prevProps.map) ||
      !isEquivalent(this.props.position, prevProps.position) ||
      (!isEquivalent(this.props.icon, prevProps.icon) && !this.props.icon.custom)) {
        if (this.marker) {
            this.marker.setMap(null);
        }
        this.renderMarker();
    }
  }

  componentWillUnmount() {
    if (this.marker) {
      this.marker.setMap(null);
    }
  }

  renderMarker() {
    const {
      map,
      google,
      position,
      mapCenter,
      icon,
      label,
      draggable,
      title,
      ...props
    } = this.props;
    if (!google) {
      return null
    }

    let pos = position || mapCenter;
    if (!(pos instanceof google.maps.LatLng)) {
      pos = new google.maps.LatLng(pos.lat, pos.lng);
    }

    const pref = {
      map,
      position: pos,
      icon,
      label,
      title,
      draggable,
      ...props
    };
    this.marker = new google.maps.Marker(pref);

    evtNames.forEach(e => {
      this.marker.addListener(e, this.handleEvent(e));
    });

    this.markerPromise.resolve(this.marker);
  }

  getMarker() {
    return this.markerPromise;
  }

  handleEvent(evt) {
    return (e) => {
      const evtName = `on${camelize(evt)}`
      if (this.props[evtName]) {
        this.props[evtName](this.props, this.marker, e);
      }
    }
  }

  render() {
    return (
      <Fragment>
        {this.props.children && this.marker ?
          React.Children.only(
            React.cloneElement(
              this.props.children, 
              { marker: this.marker,
                google: this.props.google,
                map: this.props.map}
            )
          ) : null
        }
      </Fragment>
    )
  }
}

Marker.propTypes = {
  position: PropTypes.object,
  map: PropTypes.object
}

evtNames.forEach(e => Marker.propTypes[e] = PropTypes.func)

Marker.defaultProps = {
  name: 'Marker'
}

export default Marker
