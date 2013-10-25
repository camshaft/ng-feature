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
        var name = attrs.feature;
        var not = name.charAt(0) === '!';
        var check = not ? isNotEnabled : isEnabled;
        if (not) name = name.substr(1);

        var unwatch = feature.watch(name, function(enabled) {
          // TODO can we do something like ng-if?
          elem.css('display', check(enabled) ? '' : 'none');
        });

        $scope.$on('$destroy', unwatch);
      }
    };
  }
]);

/**
 * Tell other modules how to find us
 */

package.name = 'ng-feature';

/**
 * Check if enabled is false
 *
 * @param {Boolean} enabled
 * @return {Boolean}
 * @api private
 */

function isNotEnabled(enabled) {
  return !enabled;
}

/**
 * Check if enabled is true
 *
 * @param {Boolean} enabled
 * @return {Boolean}
 * @api private
 */

function isEnabled(enabled) {
  return enabled;
}
