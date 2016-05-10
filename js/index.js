$('.nav__trigger').on('click', function(e){
     e.preventDefault();
     $(this).parent().toggleClass('nav--active');
   });
