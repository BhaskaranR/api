

import * as Wreck from 'wreck';
import * as config from 'config';
import * as GeoPoint from 'geopoint';
import * as Joi from 'joi';
import { validate } from '../helpers/util';

let API_KEY = config.get("googlePlacesAPIKey");
let OSM_KEY = config.get("OSMApiKey");

const distanceCheck = (lat1, lat2, long1, long2) => {
    let p1 = new GeoPoint(lat1, long1);
    let p2 = new GeoPoint(lat2, long2);
    return p1.distanceTo(p2, true);
};

const nearbyQueryOptional = 
 Joi.object().keys({
    name: Joi.string().optional(),
    long: Joi.number(),
    lat: Joi.number(),
    maxDistance: Joi.number().default(2),
    limit: Joi.number().default(20)
});

export default {
    Query: {
        getPlacesNearby:  async (_, { nearby }: {
            nearby: {
                name: string,
                lat: number,
                long: number,
                maxDistance: number,
                limit: number
            }
        }) => {
            try {
                const validatedLike = await validate(nearby, nearbyQueryOptional);
                return new Promise((resolve) => {
                    let googleURL;
                    let radius = 200;//Meter
                    if (nearby.name) {
                        googleURL = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + nearby.name + '&key=' + API_KEY + '&location=' + nearby.lat + ',' + nearby.long + '&radius=1000';
                    }
                    else {
                        googleURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=' + API_KEY + '&location=' + nearby.lat + ',' + nearby.long + '&radius=' + nearby.maxDistance + '&sensor=true'
                        // googleURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?&location=' + lat + ',' + long + '&radius=' + radius + '&key=' + API_KEY;
                    }
                    Wreck.get(googleURL, { json: true }, (err, res, payload) => {
                        if (err) {
                            resolve([]);
                            return;
                        }
                        if (!payload || !payload.results) {
                            resolve([]);
                            return;
                        }
                        let googleArr = [];
                        let counter = 20; //only 20 results needed
                        payload.results.forEach(location => {
                            let d = distanceCheck(nearby.long, location.geometry.location.lng, nearby.lat, location.geometry.location.lat);

                            if (counter > 0) {
                                counter--;
                            }
                            else {
                                return googleArr;
                            }
                            if (d < 100) { //Kilometer
                                googleArr.push({
                                    'id': location.place_id,
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
            }
            catch (e) {
                throw new Error(e.ValidationError);
            }
        }
    }
}
