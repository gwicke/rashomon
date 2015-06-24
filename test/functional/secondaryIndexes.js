"use strict";

// mocha defines to avoid JSHint breakage
/* global describe, context, it, before, beforeEach, after, afterEach */

var assert = require('assert');
var cass = require('cassandra-driver');
var router = require('../utils/test_router.js');
var deepEqual = require('../utils/test_utils.js').deepEqual;

var TimeUuid = cass.types.TimeUuid;

describe('Secondary Indexes', function() {

    before(function () { return router.setup(); });

    context('Table operations on Secondary Indexes', function() {
        it('successfully create a secondary index table', function() {
            this.timeout(15000);
            return router.request({
                uri: '/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable',
                method: 'put',
                body: {
                    table: 'simpleSecondaryIndexTable',
                    options: { durability: 'low' },
                    attributes: {
                        key: 'string',
                        tid: 'timeuuid',
                        latestTid: 'timeuuid',
                        uri: 'string',
                        body: 'blob',
                            // 'deleted', 'nomove' etc?
                        restrictions: 'set<string>',
                    },
                    index: [
                    { attribute: 'key', type: 'hash' },
                    { attribute: 'tid', type: 'range', order: 'desc' },
                    ],
                    secondaryIndexes: {
                        by_uri : [
                            { attribute: 'uri', type: 'hash' },
                            { attribute: 'body', type: 'proj' }
                        ]
                    }
                }
            })
            .then(function(response) {
                deepEqual(response.status, 201);
            });
        });
        it('successfully update indexes', function() {
            return router.request({
                uri: '/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable/',
                method: 'put',
                body: {
                    table: "simpleSecondaryIndexTable",
                    attributes: {
                        key: "test",
                        tid: TimeUuid.now(),
                        uri: "uri1",
                        body: 'body1'
                    },
                }
            })
            .then(function(response) {
                deepEqual(response, {status:201});

                return router.request({
                    uri: '/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable/',
                    method: 'put',
                    body: {
                        table: "simpleSecondaryIndexTable",
                        attributes: {
                            key: "test",
                            tid: TimeUuid.now(),
                            uri: "uri2",
                            body: 'body2'
                        }
                    }
                });
            })
            .then(function(response) {
                deepEqual(response, {status:201});

                return router.request({
                    uri: '/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable/',
                    method: 'put',
                    body: {
                        table: "simpleSecondaryIndexTable",
                        attributes: {
                            key: "test",
                            tid: TimeUuid.now(),
                            uri: "uri3",
                            body: 'body3'
                        },
                    }
                });
            })
            .then(function(response) {
                deepEqual(response, {status:201});

                return router.request({
                    uri: '/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable/',
                    method: 'put',
                    body: {
                        table: "simpleSecondaryIndexTable",
                        attributes: {
                            key: "test2",
                            tid: TimeUuid.now(),
                            uri: "uri1",
                            body: 'test_body1'
                        }
                    }
                });
            })
            .then(function(response) {
                deepEqual(response, {status:201});

                return router.request({
                    uri: '/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable/',
                    method: 'put',
                    body: {
                        table: "simpleSecondaryIndexTable",
                        attributes: {
                            key: "test2",
                            tid: TimeUuid.now(),
                            uri: "uri2",
                            body: 'test_body2'
                        },
                    }
                });
            })
            .then(function(response) {
                deepEqual(response, {status:201});
                return router.request({
                    uri: '/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable/',
                    method: 'put',
                    body: {
                        table: "simpleSecondaryIndexTable",
                        attributes: {
                            key: "test2",
                            tid: TimeUuid.now(),
                            uri: "uri3",
                            body: 'test_body3'
                        }
                    }
                });
            })
            .then(function(response) {
                deepEqual(response, {status:201});

                return router.request({
                    uri: '/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable/',
                    method: 'put',
                    body: {
                        table: "simpleSecondaryIndexTable",
                        attributes: {
                            key: "test2",
                            tid: TimeUuid.now(),
                            uri: "uri3",
                            // Also test projection updates
                            body: 'test_body3_modified'
                        },
                    }
                });
            })
            .then(function(response) {
                deepEqual(response, {status:201});
            });
        });
        it('successfully retrieve rows with paging enabled', function() {
            return router.request({
                uri:'/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable/',
                method: 'get',
                body: {
                    table: "simpleSecondaryIndexTable",
                    limit: 2,
                    attributes: {
                        key: 'test2',
                    }
                }
            })
            .then(function(response) {
                deepEqual(response.body.items.length, 2);
                var next = response.body.next;
                return router.request({
                    uri:'/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable/',
                    method: 'get',
                    body: {
                        table: "simpleSecondaryIndexTable",
                        limit: 2,
                        next: next,
                        attributes: {
                            key: 'test2',
                        }
                    }
                });
            })
            .then(function(response) {
                deepEqual(response.body.items.length, 2);
                var next = response.body.next;
                return router.request({
                    uri:'/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTables/',
                    method: 'get',
                    body: {
                        table: "simpleSecondaryIndexTable",
                        limit: 1,
                        next: next,
                        attributes: {
                            key: 'test2',
                        }
                    }
                });
            })
            .then(function(response) {
                deepEqual(response.body.items.length, 0);
            });
        });
        it("throw 404 for values that doesn't match any more", function() {
            return router.request({
                uri: "/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable/",
                method: "get",
                body: {
                    table: "simpleSecondaryIndexTable",
                    index: "by_uri",
                    attributes: {
                        uri: "uri1"
                    }
                }
            })
            .then(function(response){
                deepEqual(response.status, 404);
                deepEqual(response.body.items.length, 0);
                return router.request({
                    uri: "/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable/",
                    method: "get",
                    body: {
                        table: "simpleSecondaryIndexTable",
                        index: "by_uri",
                        attributes: {
                            uri: "uri2"
                        }
                    }
                });
            })
            .then(function(response){
                deepEqual(response.body.items.length, 0);
            });
        });
        it("successfully retrieve current value", function() {
            return router.request({
                uri: "/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable/",
                method: "get",
                body: {
                    table: "simpleSecondaryIndexTable",
                    index: "by_uri",
                    attributes: {
                        uri: "uri3"
                    },
                    proj: ['key', 'uri', 'body']
                }
            })
            .then(function(response){
                deepEqual(response.body.items, [{
                    key: "test2",
                    uri: "uri3",
                    body: new Buffer("test_body3_modified")
                },{
                    key: "test",
                    uri: "uri3",
                    body: new Buffer("body3")
                }]);
            });
        });
        this.timeout(15000);
        it('successfully drop tables', function() {
            return router.request({
                    uri: "/restbase.cassandra.test.local/sys/table/simpleSecondaryIndexTable",
                    method: "delete",
                    body: {}
            });
        });
    });

    context('Table operations on unversioned secondary Indexes', function() {
        it('successfully create a secondary index table with no tid in range', function() {
            this.timeout(8000);
            return router.request({
                uri: '/restbase.cassandra.test.local/sys/table/unversionedSecondaryIndexTable',
                method: 'put',
                body: {
                    table: 'unversionedSecondaryIndexTable',
                    options: { durability: 'low' },
                    attributes: {
                        key: 'string',
                        //tid: 'timeuuid',
                        latestTid: 'timeuuid',
                        uri: 'string',
                        body: 'blob',
                            // 'deleted', 'nomove' etc?
                        restrictions: 'set<string>',
                    },
                    index: [
                        { attribute: 'key', type: 'hash' },
                        { attribute: 'uri', type: 'range', order: 'desc' },
                    ],
                    secondaryIndexes: {
                        by_uri : [
                            { attribute: 'uri', type: 'hash' },
                            { attribute: 'key', type: 'range', order: 'desc' },
                            { attribute: 'body', type: 'proj' }
                        ]
                    }
                }
            })
            .then(function(response) {
                deepEqual(response.status, 201);
            });
        });
        it('successfully insert a unversioned index', function() {
            return router.request({
                uri: '/restbase.cassandra.test.local/sys/table/unversionedSecondaryIndexTable/',
                method: 'put',
                body: {
                    table: "unversionedSecondaryIndexTable",
                    attributes: {
                        key: "another test",
                        uri: "a uri",
                        body: "a body"
                    },
                }
            })
            .then(function(response){
                deepEqual(response, {status:201});
            });
        });
        it('successfully update a unversioned index', function() {
            return router.request({
                uri: '/restbase.cassandra.test.local/sys/table/unversionedSecondaryIndexTable/',
                method: 'put',
                body: {
                    table: "unversionedSecondaryIndexTable",
                    attributes: {
                        key: "another test",
                        uri: "a uri",
                        body: "abcd"
                    }
                }
            })
            .then(function(response){
                deepEqual(response, {status:201});
            });
        });
        this.timeout(15000);
        it('successfully drop tables', function() {
            return router.request({
                uri: "/restbase.cassandra.test.local/sys/table/unversionedSecondaryIndexTable",
                method: "delete",
                body: {}
            });
        });
    });
});