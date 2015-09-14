Mobird.defineModule('modules/url', function(require, exports, module) {

  var URL = {};

  var encodeString = function(str) {
    return encodeURIComponent(str).replace(/[!'()]/g, escape).replace(/\*/g, '%2A');
  };

  URL.encodeParams = function(params) {
    var buf = [];
    Mobird.each(params, function(value, key) {
      if (buf.length) {
        buf.push('&');
      }
      buf.push(encodeString(key), '=', encodeString(value));
    });
    return buf.join('').replace(/%20/g, '+');
  };

  var buildUrl = function(before_qmark, from_qmark, opt_query, opt_params) {
    var url_without_query = before_qmark;
    var query = from_qmark ? from_qmark.slice(1) : null;

    if (Mobird.isString(opt_query)) {
      query = String(opt_query);
    }

    if (opt_params) {
      query = query || '';
      var prms = URL.encodeParams(opt_params);
      if (query && prms) {
        query += '&';
      }
      query += prms;
    }

    var url = url_without_query;
    if (query !== null) {
      url += ('?' + query);
    }

    return url;
  };

  URL.constructUrl = function(url, query, params) {
    var query_match = /^(.*?)(\?.*)?$/.exec(url);
    return buildUrl(query_match[1], query_match[2], query, params);
  };

  URL.getParameter = function(url, name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
      results = regex.exec(url);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  module.exports = URL;

});
Mobird.URL = Mobird.requireModule('modules/url');