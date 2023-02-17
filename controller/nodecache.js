const NodeCache = require( "node-cache" );
const cache = new NodeCache();

exports.setCache = async function set(key, value, ttl = null) {
    if (ttl) {
        return cache.set(key, value, ttl);
    }

    return cache.set(key, value);
}

exports.getCache = async function get(key) {
    return cache.get(key);
}

exports.delCache = async function del(key) {
    return cache.del(key);
}
