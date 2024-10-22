window.addEventListener('scroll', function () {
    let items = document.querySelectorAll('.timeline-item');
    let scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  
    items.forEach((item, index) => {
      let line = item.querySelector('.line');
      let distance = index * 200 - scrollPosition * 1.5; // Adjust distance for effect
      line.style.transform = `rotate(${distance / 50}deg)`; // Dynamically adjust the rotation
    });
  });