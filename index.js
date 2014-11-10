/**
 * Module depencencies
 */

var angular = window.angular;
var feature = require('feature');

/**
 * Create our module
 */

var package = module.exports = angular.module('ng-feature', []);

package.factory('feature', [
  function() {
    return {
      watch: watch
    };

    function parseExpr(check, subs, expr) {
      var parts = expr.split(/ *\! */);
      var len = parts.length;
      if (len > 2) throw new Error('What are you trying to do here? "' + expr + '"');
      var not = len === 2;
      var name = not ? parts[1] : parts[0];

      var value = false;
      subs.push(feature.watch(name, function(newVal) {
        value = not ? !newVal : newVal;
        check();
      }));

      return function() {return value;};
    }

    function parseAnd(check, subs, expr) {
      var ands = expr.split(/ *\|\| */).map(parseExpr.bind(null, check, subs));
      return function() {
        for (var i = ands.length - 1; i >= 0; i--) {
          if (!ands[i]()) return false;
        }
        return true;
      };
    }

    function watch(expr, $scope, cb) {
      if (typeof $scope === 'function') {
        cb = $scope;
        $scope = null;
      }

      var features = expr.split(/ *\|\| */);
      var subs = [];
      var ors = [];
      ors = features.map(parseAnd.bind(null, check, subs));
      check();

      function check() {
        for (var i = ors.length - 1; i >= 0; i--) {
          if (ors[i]()) return cb(true);
        }
        return cb(false);
      }

      function unsubscribe() {
        subs.forEach(function(unwatch) {
          unwatch();
        });
        subs = [];
      }

      if ($scope) $scope.$on('$destroy', unsubscribe);
      return unsubscribe;
    }
  }
]);

/**
 * Toogle a feature based on feature flags
 */

package.directive('feature', [
  '$compile',
  'feature',
  function($compile, feature) {
    return {
      multiElement: true,
      replace: false,
      terminal: true,
      priority: 1000,
      restrict: 'A',
      compile: function(tEl, tAttrs) {
        var expr = tAttrs.feature;
        var name = '$feature_' + generateName(expr);
        var ifExpr = name;

        var ifStr = tAttrs.ngIf;
        if (ifStr) ifExpr += ' && ' + ifStr;

        tEl.attr('data-ng-if', ifExpr);
        tEl.removeAttr('data-feature');
        tEl.removeAttr('feature');

        return function($scope, elem, attrs) {
          $compile(elem)($scope);
          feature.watch(expr, $scope, function(value) {
            $scope[name] = value;
            if (!$scope.$$phase) $scope.$digest();
          });
        }
      }
    };
  }
]);

/**
 * Generate a unique name for the expression
 */

function generateName(expr) {
  return expr
    .replace(/!/g, ' not ')
    .replace(/&&/g, ' and ')
    .replace(/\|\|/g, ' or ')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_');
}

/**
 * Tell other modules how to find us
 */

package.name = 'ng-feature';
