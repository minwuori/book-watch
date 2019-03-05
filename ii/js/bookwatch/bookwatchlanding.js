//Стартовый скрипт
document.addEventListener('DOMContentLoaded', function(){
    // var bookwatch = new Bookwatch();
    // bookwatch.init();

    //сохранение выбора темы в cookies
    function readCookie(name) {

        var nameCookie = name + '=',
            allCookies = document.cookie.split(';');

        for(var i = 0; i < allCookies.length; i++) {

            while(allCookies[i].charAt(0) === ' ') {
                allCookies[i] = allCookies[i].substring(1, allCookies[i].length);
            }

            if(allCookies[i].indexOf(nameCookie) === 0) {
                return allCookies[i].substring(nameCookie.length, allCookies[i].length);
            }
        }

        return null;

    }

    var valueCookie = readCookie('theme'),
        page = document.querySelector('main'),
        checkTheme = document.getElementById('check');

    if (valueCookie === 'light') {

        checkTheme.checked = true;
        page.classList.add('light__theme');

    }

    //отслеживаем изменения checkbox выбора темы
    checkTheme.addEventListener('click', function () {

        if (checkTheme.checked) {

            page.classList.add('light__theme');
            document.cookie = 'theme=light';

        } else {

            page.classList.remove('light__theme');
            document.cookie = 'theme=dark';

        }

    });
});