//height of the header for scrolling purpses
var height = $('#header').height();

//Hide/show top arrow
$(window).scroll(function() {
    if ($(this).scrollTop() >= 200) {        // If page is scrolled more than 200px
        $('#top').fadeIn(200);    // Fade in the arrow
    } else {
        $('#top').fadeOut(200);   // Else fade out the arrow
    }
});

//links won't link to below header
$(document).ready(function() {
  $('.anchor').css('top', (height) * -1);
  //$('.anchor').css('margin-top', (height));
});


//Scrolling animation
$(document).ready(function() {
  $('a[href*=\\#]:not([href=\\#])').click(function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') || location.hostname == this.hostname) {

      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 1000);
        return false;
      }
    }
  });
});

//Scroll to top
$('#top').click(function(){
		$('html, body').animate({scrollTop : 0},800);
		return false;
	});
