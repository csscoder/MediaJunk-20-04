$(window).on('resize', function () {
  $('.box-frame').height($(window).height() - $('.l-header').height() );
});
$(window).trigger('resize');
