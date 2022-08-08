export default class AnnoyingScroll {

  /*
    on mouseup, if scrollY is not divisible by innerHeight,
    find the closest scrollY that is and move up or down
  */

  scrollBlocked = false;
  blockSafetyTimeoutId;
  bodyHeight;
  scrollAnimationIntervalId;
  lastTouchY;

  /* these have to do with tab accessibility */
  firstFocusableElement;
  allFocusableElements = [];
  menuButton;
  footer;
  /*
    whlie turnedOff the object shouldn't really do anything,
    currently it is turned off only when menu is open
  */
  turnedOff = false;

  constructor() {
    this.bodyHeight = document.body.getBoundingClientRect().height;
    window.addEventListener('resize', () => {
      this.bodyHeight = document.body.getBoundingClientRect().height;
    });

    // tab accessibility
    this.firstFocusableElement = document.querySelector('[data-first-focusable="1"]');
    this.menuButton = document.querySelector('.header-bottom__menu-button');
    this.footer = document.querySelector('.the-footer');

    const allATags = document.getElementsByTagName('a');
    const allButtonTags = document.getElementsByTagName('button');
    const mainMenu = document.querySelector('.main-menu');

    for(let val of allATags)
      if(!mainMenu.contains(val))
        this.allFocusableElements.push(val);

    for(let val of allButtonTags)
      if(!mainMenu.contains(val))
        this.allFocusableElements.push(val);

    // make website traversable using tab
    window.addEventListener('keydown', (e) => this.tabReact(e), { passive: false} );

    document.querySelector('.the-main__go-down-button').addEventListener('click',
      () => this.moveDown());

    // when user releases the scrollbar
    window.addEventListener('mouseup', 
      () => {
        if(this.turnedOff)
          return;

        this.findTheClosest();
      }
    );

    window.addEventListener('wheel',
      e => {
        if(this.turnedOff)
          return;

        // allow zooming in and out
        if(e.ctrlKey)
          return;

        e.preventDefault();

        if(e.deltaY < 0)
          this.moveUp();
        else
          this.moveDown();
      },
      { passive: false }
    );

    window.addEventListener('touchstart',
      e => {
        if(this.turnedOff)
          return;
        this.lastTouchY = e.touches[0].clientY;  
      }
    );

    window.addEventListener('touchmove',
      e => {
        if(this.turnedOff)
          return;

        e.preventDefault();

        if(e.touches[0].clientY < this.lastTouchY)
          this.moveDown();
        else
          this.moveUp();

        this.lastTouchY = e.touches[0].clientY;
      },
      { passive: false }
    );

    window.addEventListener('keydown',
      (e) => {
        if(this.turnedOff)
          return;

        switch(e.key) {
          case 'ArrowUp':
            e.preventDefault();
            this.moveUp();
            break;

          case 'ArrowDown':
            e.preventDefault();
            this.moveDown();
            break;

          case 'PageUp':
            e.preventDefault();
            this.moveUp(true);
            break;

          case 'PageDown':
            e.preventDefault();
            this.moveDown(true);
            break;

          // spacebar
          case ' ':
            e.preventDefault();

            if(e.shiftKey)
              this.moveUp();
            else
              this.moveDown();
            break;
        }
      },
      { passive: false }
    );

  }

  tabReact(e) {
    if(e.key !== 'Tab')
      return;

    if(document.activeElement.tagName === 'BODY') {
      e.preventDefault();
      this.firstFocusableElement.focus();
    }
    
    /*
      - jeżeli jest nastęny element, który ma display !== 'none'
      i nie należy do footera, nie rób nic
      - w przeciwnym razie:
        - jeżeli jesteś na samym dole focusuj przyciski footera
        (czyli też nie rób nic)
        - jeżeli nie to przesuń w dół i focusuj pierwszy przycisk po Menu
    */
    //this.allFocusableElements;

    console.log(...this.allFocusableElements)

    // if user is not trying to move down with tab and page is not scrolled to bottom
    if(!e.shiftKey && !(scrollY >= this.bodyHeight - innerHeight)) {
      for(let val of this.allFocusableElements) {
        console.log(document.activeElement.compareDocumentPosition(val));
        if(
            !this.footer.contains(val) &&
            !getComputedStyle(val).display === 'none' &&
            // if val is not after the active element
            document.activeElement.compareDocumentPosition(val) === 4
          )
          break;

        console.log(val, document.activeElement)
        e.preventDefault();

        this.moveDown();

        break;
        // check if there is focusable element that doesn't belong to the footer
        // after the one that isn't focused 
      }
    }

  }

  findTheClosest() {
    if(scrollY % innerHeight === 0)
      return;

    if(this.turnedOff)
      return;

    if(this.scrollBlocked)
      return;

    for(let i = 0; i < this.bodyHeight; i += innerHeight) {
      if(Math.abs(scrollY - i) < innerHeight) {
        if(Math.abs(scrollY - i) < Math.abs(scrollY - i - innerHeight))
          this.moveUp();
        else
          this.moveDown();
        
        break;
      }
    }
  }

  moveUp(instant) {
    if(this.turnedOff)
      return;

    if(this.scrollBlocked || scrollY === 0)
      return;

    let scrollDestination = scrollY - innerHeight;

    if(scrollDestination < 0)
      scrollDestination = 0;
    else if(scrollDestination % innerHeight !== 0) {

      for(let i = innerHeight * 2; i < this.bodyHeight; i += innerHeight) {

        if(i >= scrollY) {
          scrollDestination = i - innerHeight;
          break;
        }
      }
    }

    clearInterval(this.scrollAnimationIntervalId);

    if(instant) {
      scrollTo({
        top: scrollDestination, 
        behavior: 'instant'
      });
      return;
    }

    this.blockScroll();
    const scrollAmount = (scrollDestination - scrollY) / 30;
    this.scrollAnimationIntervalId = 
      setInterval(() => this.scrollingFunction(scrollDestination, scrollAmount, 'up'), 10);
  }

  moveDown(instant) {
    if(this.turnedOff)
      return;

    // don't do anything if it's currently scrolling
    // or scroll is at the end
    if(
        this.scrollBlocked ||
        scrollY >= this.bodyHeight - innerHeight
      )
      return;

    let scrollDestination = scrollY + innerHeight;

    // destination is not valid if it's not divisible by viewport height
    // if so, find valid destination
    if(scrollDestination % innerHeight !== 0) {

      for(let i = innerHeight; i < this.bodyHeight; i += innerHeight) {

        if(i > scrollY) {
          scrollDestination = i;
          break;
        }
      }
    }

    clearInterval(this.scrollAnimationIntervalId);

    if(instant) {
      scrollTo({
        top: scrollDestination, 
        behavior: 'instant'
      });
      return;
    }

    this.blockScroll();
    const scrollAmount = (scrollDestination - scrollY) / 30;
    this.scrollAnimationIntervalId = 
      setInterval(() => this.scrollingFunction(scrollDestination, scrollAmount, 'down'), 10);
  }

  scrollingFunction(scrollDestination, scrollAmount, upOrDown) {
    if(
        (upOrDown === 'down' &&
        scrollY + scrollAmount >= scrollDestination) ||
        (upOrDown === 'up' &&
        scrollY + scrollAmount <= scrollDestination)
      ) {
      clearInterval(this.scrollAnimationIntervalId);
      scrollTo({
        top: scrollDestination, 
        behavior: 'instant'
      });

      setTimeout(() => {
        this.unblockScroll();
      }, 500);

      return;
    }

    scrollBy({
      top: scrollAmount, 
      behavior: 'instant'
    });
  }

  blockScroll() {
    this.scrollBlocked = true;

    this.blockSafetyTimeoutId = setTimeout(() => {
      this.scrollBlocked = false;
    }, 1000);
  }

  unblockScroll() {
    clearTimeout(this.blockSafetyTimeoutId);
    this.scrollBlocked = false;
  }

  turnOff() {
    this.turnedOff = true;
  }

  turnOn() {
    this.turnedOff = false;
  }

}