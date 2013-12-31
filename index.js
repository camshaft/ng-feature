/**
 * Module depencencies
 */

var angular = window.angular;
var feature = require('feature');

/**
 * Create our module
 */

var package = module.exports = angular.module('ng-feature', []);

/**
 * Toogle a feature based on feature flags
 */

package.directive('feature', [
  function() {
    return {
      restrict: 'A',
      link: function($scope, elem, attrs) {
        elem.addClass('ng-feature-disabled');
        var features = attrs.feature.split('||');
        var subs = [];
        var ors = [];

        ors = features.map(function(ands) {
          ands = ands.split('&&').map(function(cond) {
            var name = cond.trim();
            var not = name.charAt(0) === '!';
            if (not) name = name.substr(1);
            subs.push(feature.watch(name, check));
            return not
              ? function() { return !feature(name); }
              : function() { return feature(name); };
          });

          return function() {
            for (var i = ands.length - 1; i >= 0; i--) {
              if (!ands[i]()) return false;
            }
            return true;
          };
        });

        check();

        function check() {
          for (var i = ors.length - 1; i >= 0; i--) {
            if (ors[i]()) return elem.removeClass('ng-feature-disabled');
          }
          return elem.addClass('ng-feature-disabled');
        }

        $scope.$on('$destroy', function() {
          subs.forEach(function(unwatch) {
            unwatch();
          });
        });
      }
    };
  }
]);

/**
 * Tell other modules how to find us
 */

package.name = 'ng-feature';
