import * as Wreck from 'wreck';
import * as Trie from 'trie-prefix-tree';

 export function search(options) {
    var seneca = this
    var trie = Trie([]);

    options = seneca.util.deepextend({
        elastic: {
            host: 'localhost',
            port: 9200,
            base: 'ks'
        },
    }, options)


    seneca.add('role:search,cmd:insert', cmd_insert)
    seneca.add('role:search,cmd:search', cmd_search)
    seneca.add('role:search,cmd:add', cmd_add)
    seneca.add('role:search,cmd:suggest', cmd_suggest)

    function cmd_add(msg, reply) {
        trie.addWord('' + msg.query)
        reply()
    }

    function cmd_suggest(msg, reply) {
        var q = '' + msg.query
        reply('' === q ? [] : (trie.getPrefix(q) || []))
    }

    function cmd_insert(msg, reply) {
        var seneca = this

        var elastic = options.elastic

        var url = 'http://' + elastic.host + ':' + elastic.port +
            '/' + elastic.base + '/mod/' + msg.data.name

        Wreck.post(
            url, { json: true, payload: seneca.util.clean(msg.data) },
            function(err, res, payload) {
                reply(err, payload)
            })
    }


    function cmd_search(msg, reply) {
        var seneca = this

        var elastic = options.elastic

        var url = 'http://' + elastic.host + ':' + elastic.port +
            '/' + elastic.base + '/_search?q=' + encodeURIComponent(msg.query)

        Wreck.get(url, { json: true }, function(err, res, payload) {
            if (err) return reply(err)

            var qr = payload
            var items = []

            var hits = qr.hits && qr.hits.hits

            if (hits) {
                for (var i = 0; i < hits.length; i++) {
                    var hit = hits[i]
                    items.push(seneca.util.clean(hit._source))
                }
            }
            setTimeout(function() { reply({ items: items }) }, 400)
        })
    }
}