'use strict';

import * as boom from 'boom';
import * as Wreck from 'wreck';
import * as GeoPoint from 'geopoint';
import * as config from 'config';

const API_KEY = config.get("googlePlacesAPIKey");
const OSM_KEY = config.get("OSMApiKey");
const logger = require('karmasoc-util').logger;

export const distanceCheck = (lat1, lat2, long1, long2) => {
    let p1 = new GeoPoint(lat1, long1);
    let p2 = new GeoPoint(lat2, long2);
    return p1.distanceTo(p2, true);
};


//reverse search to google (only use if openstreetmap fails)
export const findNameOfPosition = (long, lat) => {
    return new Promise((resolve, reject) => {

        let googleURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?&location=' + lat + ',' + long + '&radius=100&key=' + API_KEY;

        Wreck.get(googleURL, { json: true }, (err, res, payload) => {
            if (err) {
                console.log('cityname search error');
                return reject(err);
            }

            let placeId = payload.results[0].place_id;

            let placeURL = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + placeId + '&key=' + API_KEY;

            Wreck.get(placeURL, { json: true }, (err, res, payload) => {
                if (err) {
                    console.log('cityname details error');
                    resolve({
                        'title': '',
                        'place_id': ''
                    });
                }

                // DIRTY HACK START
                let idx = payload.result.address_components.length > 1 ? 1 : 0;

                let city = {
                    'title': payload.result.address_components[idx].long_name,
                    'place_id': payload.result.place_id
                };

                resolve(city);

            });
        });
    });

};

//reverse search to openstreetmap
export const findNameOfPosition2 = (long, lat) => {

    return new Promise((resolve, reject) => {
        let mapURL = 'http://open.mapquestapi.com/nominatim/v1/reverse.php?key=' + OSM_KEY + '&format=json&lat=' + lat + '&lon=' + long;
        Wreck.get(mapURL, { json: true }, (err, res, payload) => {
            if (err) {
                logger.warn('cityname search error for long,lat:', long, lat, err);
                return reject(err);
            }

            if (!payload || payload.hasOwnProperty('error')) {
                logger.warn('openstreetmap: payload search error for long,lat:', long, lat);
                return reject(boom.badRequest());
            }

            let place = payload.address;

            if (!place) {
                logger.warn('there was no address property from openstreetmap for long,lat:', long, lat);
                place = {};
            }

            let cityname = place.city || place.town || place.village || place.county || place.state || place.country || 'Unknown';

            resolve({
                'title': cityname,
                'place_id': payload.place_id  //OSM id!!!
            });
        });
    });
};

export const bizSearch = (text, lat, long) => {
    return new Promise((resolve) => {

        let googleURL;
        let radius = 200;//Meter
        if (text) {
            googleURL = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + text + '&key=' + API_KEY + '&location=' + lat + ',' + long + '&radius=1000';
        }
        else {
            googleURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=' + API_KEY + '&location=' + lat + ',' + long + '&radius=' + radius + '&sensor=true'
            // googleURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?&location=' + lat + ',' + long + '&radius=' + radius + '&key=' + API_KEY;
        }

        Wreck.get(googleURL, { json: true }, (err, res, payload) => {
            if (err) {
                resolve([]);
                logger.warn(err);
                return;
            }

            if (!payload || !payload.results) {
                resolve([]);
                logger.warn(err);
                return;
            }

            let googleArr = [];

            let counter = 20; //only 20 results needed
            payload.results.forEach(location => {
                let d = distanceCheck(long, location.geometry.location.lng, lat, location.geometry.location.lat);

                if (counter > 0) {
                    counter--;
                }
                else {
                    return googleArr;
                }
                if (d < 100) { //Kilometer
                    googleArr.push({
                        '_id': location.place_id,
                        'title': location.name,
                        'distance': d,
                        'geotag': {
                            'type': 'Point',
                            'coordinates': {
                                lat: location.geometry.location.lat,
                                long: location.geometry.location.lng
                            }
                        }
                    }
                    );
                }
            });

            resolve(googleArr);
        });

    });
};
