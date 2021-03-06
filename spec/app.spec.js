var buster         = require('buster')
  , ExpressTestBot = require('express-test-bot')
  // , ExpressTestBot = require(__dirname + '/../../node-express-test-bot/index.js')
  , Helper         = require('./helper.js')
  , exec           = require('child_process').exec

buster.spec.expose()
buster.testRunner.timeout = 10000

describe('ImageableServer', function() {
  before(function() {
    this.server = new ExpressTestBot()
    this.tmpImage = 'test.gif'
  })

  after(function(done) {
    exec('rm -f ' + this.tmpImage, done)
  })

  describe('GET /', function() {
    it('returns not so friendly home page', function(done) {
      this.server.get('/', function(err, stdout, stderr) {
        expect(stdout).toMatch('This is not the page you are looking for.')
        done()
      })
    })
  })

  describe('GET /resize', function() {
    it('resizes the image to 200x80', function(done) {
      var url = '/resize/magic?url=' + Helper.getEncodedImageUrl('google') + '&size=200x400'

      this.server.get(url, { toFile: this.tmpImage }, function() {
        Helper.identify(this.tmpImage, function(err, stdout, stderr) {
          expect(err).toBeNull()
          expect(stdout).toBeDefined()
          expect(stdout).toMatch("200x80")

          done()
        }.bind(this))
      }.bind(this))
    })
  })

  describe('GET /fit', function() {
    it('resizes the image to 200x400', function(done) {
      var url = '/fit/magic?url=' + Helper.getEncodedImageUrl('google') + '&size=200x400'

      this.server.get(url, { toFile: this.tmpImage }, function() {
        Helper.identify(this.tmpImage, function(err, stdout, stderr) {
          expect(err).toBeNull()
          expect(stdout).toBeDefined()
          expect(stdout).toMatch("200x400")

          done()
        }.bind(this))
      }.bind(this))
    })
  })

  describe('GET /crop', function() {
    it('resizes the image to 50x50 if no size param was passed', function(done) {
      var url = '/crop/magic?url=' + Helper.getEncodedImageUrl('google') + '&crop=' + encodeURIComponent('50x50+10+10')

      this.server.get(url, { toFile: this.tmpImage }, function() {
        Helper.identify(this.tmpImage, function(err, stdout, stderr) {
          expect(err).toBeNull()
          expect(stdout).toBeDefined()
          expect(stdout).toMatch("50x50")

          done()
        }.bind(this))
      }.bind(this))
    })

    it("will correctly load the image with a valid hash", function(done) {
      var query = 'url=' + Helper.getEncodedImageUrl('google') + '&crop=' + encodeURIComponent('200x400+10+10')
        , hash  = Helper.hash(query)
        , url   = '/crop/' + hash + '?' + query

      this.server.get(url, function(err, stdout, stderr) {
        expect(stdout).toMatch('GIF89')
        done()
      }.bind(this))
    })

    it("crashes when hash is invalid", function(done) {
      var url = '/crop/barfooz?url=' + Helper.getEncodedImageUrl('google') + '&crop=' + encodeURIComponent('200x400+10+10')

      this.server.get(url, function(err, stdout, stderr) {
        expect(stdout).toMatch("Hash mismatch")
        done()
      }.bind(this))
    })
  })

  describe('pidfile', function() {
    before(function() {
      this.exists  = require('fs').exists || require('path').exists
      this.pidfile = process.cwd() + "/tmp/node_imageable_server.pid"
    })

    it("has no pidfile when server is stopped", function(done) {
      this.exists(this.pidfile, function(exists) {
        expect(exists).toBeFalse()
        done()
      })
    })

    it("creates a pidfile on server start", function(done) {
      var killServer = this.server.killServer

      this.server.killServer = function() {
        this.exists(this.pidfile, function(exists) {
          expect(exists).toBeTrue()
          killServer.call(this.server)

          done()
        }.bind(this))
      }.bind(this)

      this.server.get('/', function(){})
    })

    it("removes the pidfile after the server was stopped", function(done) {
      var killServer = this.server.killServer

      this.server.killServer = function() {
        killServer.call(this.server)

        setTimeout(function() {
          this.exists(this.pidfile, function(exists) {
            expect(exists).toBeFalse()
            done()
          }.bind(this))
        }.bind(this), 500)

      }.bind(this)

      this.server.get('/', function(){})
    })
  })
})
