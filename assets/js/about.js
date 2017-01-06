$(document).ready(function(){

    // Init Material scripts for buttons ripples, inputs animations etc, more info on the next link https://github.com/FezVrasta/bootstrap-material-design#materialjs
    $.material.init();

    // Activate the Tooltips
    $('[data-toggle="tooltip"], [rel="tooltip"]').tooltip();

    // Activate Datepicker
    /*
    if($('.datepicker').length !== 0){
      $('.datepicker').datepicker({
           weekStart:1
      });
    }
    */

    // Activate Popovers
    /*
    $('[data-toggle="popover"]').popover();
    */

    // Active Carousel
    /*
	   $('.carousel').carousel({
      interval: 400000
    });
    */

});
