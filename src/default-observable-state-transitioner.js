'use strict';

define(['knockout'], function (ko) {
    function DefaultObservableStateTransitioner(options) {
        this.__isObservableProperty = false;

        (options && options['observableProperties'] || []).forEach(p => {
            this.__isObservableProperty = this.__isObservableProperty || {};
            this.__isObservableProperty[p] = true;
        });
    }

    DefaultObservableStateTransitioner.prototype = {
        'constructor': function (entry) {
            var isObservableProperty = this.__isObservableProperty;
            if (!isObservableProperty)
                return entry;

            var observable = {};
            var propertyNameParent = '';
            var makeObservable = function (o, bindingObservable) //create observables recursively
            {
               Object.keys(o).forEach(function (p) {
                  if (typeof o[p] === 'object' && o[p] !== null) {
                     bindingObservable[p] = o[p];
                     if (o[p]) {
                        propertyNameParent += p + '.';
                        makeObservable(o[p], bindingObservable[p]);
                        propertyNameParent = propertyNameParent.replace(p + '.', '');
                     }
                  }
                  else {
                     if (isObservableProperty && isObservableProperty[propertyNameParent + p])
                        bindingObservable[p] = ko.isObservable(o[p]) ? o[p] : ko.observable(o[p]);  //if property is already an observable, then uses it
                     else
                        bindingObservable[p] = o[p];
                  }
               });
            };
            makeObservable(entry, observable);
            return observable;
        },
        'updater': function (observable, updatedEntry) {
            var isObservableProperty = this.__isObservableProperty;
            if (!isObservableProperty)
                return observable;

            var updateObservable = function (o, bindingObservable) //update observables recursively
            {
               Object.keys(o).forEach(function (p) {
                  if (typeof o[p] === 'object' && o[p] !== null) {
                     if (o[p] && bindingObservable) {
                        updateObservable(o[p], bindingObservable[p]);
                     }
                  }
                  else {
                     if (ko.isObservable(bindingObservable[p])) {
                        if (ko.isWritableObservable(bindingObservable[p]))
                           bindingObservable[p](ko.unwrap(o[p]));
                     }
                     else
                        bindingObservable[p] = ko.unwrap(o[p]);
                  }
               });
            };
            updateObservable(updatedEntry, observable);
            return observable;
        },
        'destructor': function () {},
        'updateProperties': function(options) {
          this.__isObservableProperty = false;
          (options && options['observableProperties'] || []).forEach(function(p) {
              this.__isObservableProperty = this.__isObservableProperty || {};
              this.__isObservableProperty[p] = true;
          }.bind(this));
      }
    };

    return DefaultObservableStateTransitioner;
});
