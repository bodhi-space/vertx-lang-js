var Assert = org.junit.Assert;

var CountDownLatch = java.util.concurrent.CountDownLatch;
var TimeUnit = java.util.concurrent.TimeUnit;

// Use an embedded Vert.x
var Vertx = require("vertx-js/vertx");

var console = require("vertx-js/util/console");

function testStopCalled() {
  var vertx = Vertx.vertx();
  var latch = new CountDownLatch(1);
  vertx.deployVerticle("js:test_verticle", function(deploymentID, err) {

    Assert.assertNotNull(deploymentID);
    Assert.assertNull(err);

    vertx.eventBus().consumer("testComplete").handler(function(msg) {
      // Verticle will send a message if vertxStop is called
      Assert.assertEquals("foo", msg.body());
      latch.countDown();
    })

    vertx.undeploy(deploymentID, function (v, err) {
      Assert.assertNull(v);
      Assert.assertNull(err);
    });
  });

  Assert.assertTrue(latch.await(2, TimeUnit.MINUTES));
}

function testFailureInStop() {

  var vertx = Vertx.vertx();
  var latch = new CountDownLatch(1);
  vertx.deployVerticle("js:test_verticle_fail", function(deploymentID, err) {

    Assert.assertNotNull(deploymentID);
    Assert.assertNull(err);

    vertx.undeploy(deploymentID, function (v, err) {
      Assert.assertNull(v);
      Assert.assertNotNull(err);
      latch.countDown();
    });
  });

  Assert.assertTrue(latch.await(2, TimeUnit.MINUTES));
}

function testStoppedOKIfNoVertxStop() {
  var vertx = Vertx.vertx();
  var latch = new CountDownLatch(1);
  vertx.deployVerticle("js:test_verticle_no_vertxstop", function(deploymentID, err) {

    Assert.assertNotNull(deploymentID);
    Assert.assertNull(err);

    vertx.undeploy(deploymentID, function (v, err) {
      Assert.assertNull(v);
      Assert.assertNull(err);
      latch.countDown();
    });
  });

  Assert.assertTrue(latch.await(2, TimeUnit.MINUTES));
}

function testDeployMultipleInstances() {
  var vertx = Vertx.vertx();
  var latch = new CountDownLatch(1);
  var numInstances = 3;
  var count = 0;
  var tooMany = false;
  vertx.eventBus().consumer("fooaddress", function(msg) {
    count++;
    if (count > numInstances) {
      tooMany = true;
    }
    if (count == numInstances) {
      // End on a timer to allow any further messages to arrive
      vertx.setTimer(500, function() {
        latch.countDown();
      });
    }
  });
  vertx.deployVerticle("js:test_verticle_multiple", {instances: numInstances});
  Assert.assertTrue(latch.await(2, TimeUnit.MINUTES));
  Assert.assertFalse(tooMany);
}

function testDeployMultipleInstancesWithVertxStart() {
  var vertx = Vertx.vertx();
  var latch = new CountDownLatch(1);
  var numInstances = 3;
  var count = 0;
  var initCount = 0;
  vertx.eventBus().consumer("fooaddressinit", function(msg) {
    initCount++;
  });
  vertx.eventBus().consumer("fooaddress", function(msg) {
    count++;
    if (count == numInstances) {
      // End on a timer to allow any further messages to arrive
      vertx.setTimer(500, function() {
        latch.countDown();
      });
    }
  });
  vertx.deployVerticle("js:test_verticle_vertxstart", {instances: 3});
  Assert.assertTrue(latch.await(2, TimeUnit.MINUTES));
  Assert.assertEquals(numInstances, count, 0);
  Assert.assertEquals(1, initCount, 0);
}

if (typeof this[testName] === 'undefined') {
  throw "No such test: " + testName;
}

this[testName]();