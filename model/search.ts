import * as Wreck from 'wreck';
import * as Trie from 'trie-prefix-tree';
import * as config from "config";


const elasticUrl = config.get("elasticSearchUrl");

export class Search {
    private trie = Trie([]);
    add(query) {
        this.trie.addWord('' + query)
    }

    suggest(query) {
        var q = '' + query
        return '' === q ? [] : (this.trie.getPrefix(q) || []);
    }

    async insert(data) {
        const url = elasticUrl + '/mod/' + data.name
        return await Wreck.post(
            url, { json: true, payload: data },
            function (err, res, payload) {
                if (err)
                    throw err;
                else
                    return payload
            });
    }

    async search(query) {
        var seneca = this
        var url = elasticUrl + '/_search?q=' + encodeURIComponent(query)
        this.add(query)
        return await Wreck.get(url, { json: true }, function (err, res, payload) {
            if (err) {
                throw err;
            }
            var qr = payload
            var items = []
            var hits = qr.hits && qr.hits.hits
            if (hits) {
                for (var i = 0; i < hits.length; i++) {
                    var hit = hits[i]
                    items.push(hit._source)
                }
            }
            return  items;
        })
    }
}