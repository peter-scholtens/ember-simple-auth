/** @module ember-simple-auth/authenticators/oauth2-implicit-grant **/

import BaseAuthenticator from './base';
/**
  Parses the location hash (as received from `window.location.hash`) into an
  object, e.g.:

  ```js
  parseResponse('/routepath#access_token=secret-token&scope=something'); // => { access_token: 'secret-token', scope: 'something' }
  ```

  @function parseResponse
  @param {String} locationHash The location hash (as received from `window.location.hash`)
  @return {Object} An obect with individual properties and values for the data parsed from the location hash
  @memberof module:ember-simple-auth/authenticators/oauth2-implicit-grant
*/
export function parseResponse(locationHash: string): Record<string, string> {
  let params: Record<string, string> = {};
  const query = locationHash.substring(locationHash.indexOf('?'));
  const regex = /([^#?&=]+)=([^&]*)/g;
  let match;

  // decode all parameter pairs
  while ((match = regex.exec(query)) !== null) {
    const [_, key, value] = match;
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }

  return params;
}

export type ImplicitGrantData = {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  access_token: string;
  error?: string;
};

/**
 Authenticator that conforms to OAuth 2
 ([RFC 6749](http://tools.ietf.org/html/rfc6749)), specifically the _"Implicit
 Grant Type"_.

 Use {@linkplain SessionService.authenticate} in your
 OAuth 2.0 redirect route to parse authentication parameters from location
 hash string into an object.

 @class OAuth2ImplicitGrantAuthenticator
 @extends BaseAuthenticator
 @public
 */
export default class OAuth2ImplicitGrantAuthenticator extends BaseAuthenticator {
  /**
   Restores the session from a session data object; __will return a resolving
   promise when there is a non-empty `access_token` in the session data__ and
   a rejecting promise otherwise.

   @memberof OAuth2ImplicitGrantAuthenticator
   @method restore
   @param {Object} data The data to restore the session from
   @return {Promise} A promise that when it resolves results in the session becoming or remaining authenticated
   @public
   */
  restore(data: ImplicitGrantData) {
    return new Promise((resolve, reject) => {
      if (!this._validateData(data)) {
        return reject('Could not restore session - "access_token" missing.');
      }

      return resolve(data);
    });
  }

  /**
   Authenticates the session using the specified location `hash`
   (see https://tools.ietf.org/html/rfc6749#section-4.2.2).

   __If the access token is valid and thus authentication succeeds, a promise that
   resolves with the access token is returned__, otherwise a promise that rejects
   with the error code as returned by the server is returned
   (see https://tools.ietf.org/html/rfc6749#section-4.2.2.1).

   @memberof OAuth2ImplicitGrantAuthenticator
   @method authenticate
   @param {Object} hash The location hash
   @return {Promise} A promise that when it resolves results in the session becoming authenticated
   @public
   */
  authenticate(hash: ImplicitGrantData) {
    return new Promise((resolve, reject) => {
      if (hash.error) {
        reject(hash.error);
      } else if (!this._validateData(hash)) {
        reject('Invalid auth params - "access_token" missing.');
      } else {
        resolve(hash);
      }
    });
  }

  /**
   This method simply returns a resolving promise.

   @memberof OAuth2ImplicitGrantAuthenticator
   @method invalidate
   @return {Promise} A promise that when it resolves results in the session being invalidated
   @public
   */
  invalidate() {
    return Promise.resolve();
  }

  _validateData(data: ImplicitGrantData) {
    // see https://tools.ietf.org/html/rfc6749#section-4.2.2
    return data && data.access_token;
  }
}
