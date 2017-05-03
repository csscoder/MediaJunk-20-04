(function () {
  'use strict';

  $(document).ready(function () {
    var boxHeader = $('.header');
    var boxNavigation = $('.header-nav');
    var htmlBox = $('.l-html');
    
    $('.js-toggle-menu').click(function() {
      boxHeader.toggleClass('show--menu');
      htmlBox.toggleClass('show--menu');
      boxHeader.addClass('start--animation');
      boxNavigation.stop().fadeToggle(function () {
        boxHeader.removeClass('start--animation');
      });
    });
    
    void 0;
    
    
    $(window).on('resize', function () {
      $('.box-frame').height($(window).height() - $('.l-header').height() );
    });
    $(window).trigger('resize');
    

  });

})();
