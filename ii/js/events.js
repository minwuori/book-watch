var component = window.component || {};

// счетчики корзины, резерва, закладок везде
// обозначаются атрибутами вида data-counter-basket, data-counter-bookmarks
component.counter = {
	attr: 'data-counter-',

	getSelector: function(type) {
		return '[' + this.attr + type + ']';
	},

	// получение текущего значения счетчика
	get: function(type) {
		var selector = this.getSelector(type);
		if (!selector) return false;

		// получение первого элемента с нужным селектором
		var el = document.querySelector(selector);
		if (!el) return false;

		return parseInt(el.textContent) || 0;
	},

	// установка нового значения всем счетчикам на странице
	set: function(type, value) {
		var selector = this.getSelector(type);
		if (!selector) return false;

		if (value < 0) value = 0;
		var els = Array.prototype.slice.call(document.querySelectorAll(selector));
		els.forEach(function(el) {
			el.textContent = value;
		});
	},

	// изменение счетчика на величину incr
	update: function(type, incr) {
		var count = this.get(type);
		count = count || 0;
		count = count + incr;
		this.set(type, count);
	}
}

// кнопка Добавить в Закладки
component.bookmarksButton = {
	inBookmarksText: 'Товар в Закладках',
	url: '/personal/basket/bookmarks/',
	addedAttr: 'data-added',

	setAdded: function(btn) {
		btn.setAttribute(this.addedAttr, '');
		btn.querySelector('span').textContent = this.inBookmarksText;
	},

	toBookmarks: function() {
		window.location.href = this.url;
	},

	add: function(btn) {
		if (btn.hasAttribute(this.addedAttr)) {
			component.bookmarksButton.toBookmarks();
			return;
		}

		events.auth.check(function() {
			var itemId = btn.dataset.bookId;
			var params = {
				items: [itemId]
			};

			api.bookmarks.add(params, function(res) {
				if (res.result) {
					component.counter.update(views.basket.tabs.bookmarks, +1);
					component.bookmarksButton.setAdded(btn);
				} else {
                    views.showNotification(res.warnings[0].message);
                }
			})
		});

	}
};

// Прелоадер
component.preloader = {
	selector: '.preloader_svg',
	getElement: function(el) {
		var preloader;
		if (el) {
			preloader = el.querySelector(component.preloader.selector);
			if (!preloader) {
				preloader = document.querySelector(component.preloader.selector).cloneNode(true);
				el.appendChild(preloader);
			}
		} else {
			preloader = document.querySelector(component.preloader.selector);
		}
		return preloader;
	},
	show: function(el) {
		var preloader = component.preloader.getElement(el);
		preloader.classList.remove('hidden');
	},
	hide: function(el) {
		var preloader = component.preloader.getElement(el);
		preloader.classList.add('hidden');
	}
};



// изменения представления
var views = {

	// отображение попапа с сообщением
	showNotification: function (text) {
		var popupNotification = Popup ? Popup.getInstance('notification', '.popup-notification') : null;
		if (!popupNotification) return;
		$('.popup-notification .popup__text').html(text);
		popupNotification.show();
        dataLayer.push({
            'event': 'popup_msg',
            'eventCat': 'popup',
            'eventAct': 'msg',
            'eventLab': text,
    	});
	},

	// отображение прелоадера
	// пока идет перерасчет
	showPreloader: function () {
		$('.preloader_svg').removeClass('hidden');
	},

	// скрытие прелоадера
	hidePreloader: function () {
		$('.preloader_svg').addClass('hidden');
	},

	// меню каталога в шапке
	catalogMenu: {
		// показать выпадающий попап при наведении
		setPopup: function (menuItem) {
			var popup = $(menuItem).find('.catalog__list');
			var popupOffset = this.countLeft($(menuItem), popup) - 15;
			popup.css('left', popupOffset + 'px');

			$('body').trigger('catalogMenu.showPopup', [menuItem]);
		},

		// рассчитать положение попапа
		countLeft: function (item, popup) {
			var menuWidth = $('.nav__items').width();
			var menuOffset = $('.nav__items').offset().left;
			var diff = (menuWidth + menuOffset) - (popup.width() + item.offset().left - 15);
			if (diff > 0) return 0;
			else return diff;
		},
	},

	catalog: {
		togglerAttr: 'data-toggle-view',
		viewAttr: 'data-view',

		changeView: function(view) {

			var togglers = document.querySelectorAll('[' + views.catalog.togglerAttr + ']');
			Array.prototype.slice.call(togglers).forEach(function(el) {
				if (el.getAttribute(views.catalog.togglerAttr) == view) {
					el.classList.add('active');
				} else {
					el.classList.remove('active');
				}
			});

			var viewsBlocks = document.querySelectorAll('[' + views.catalog.viewAttr + ']');
			Array.prototype.slice.call(viewsBlocks).forEach(function(el) {
				el.setAttribute(views.catalog.viewAttr, view);
			})

		}
	},

	// корзина
	basket: {
		tabs: {
			basket: 'basket',
			reserve: 'reserve',
			bookmarks: 'bookmarks',
			expected: 'expected'
		},

		// обновить кнопку Купить -> В корзине
		updateBuyButton: function (button) {
			// Kosyanenko: откуда конкретно брать статусы и тексты?
			button.setAttribute('data-status', 'in-basket');
			button.removeAttribute('data-type');
			var text = button.querySelector('.text');
			if (!text) text = button;

			text.textContent = 'В корзине';

			button.onclick = function () {
				location.href = '/personal/basket/';
			}
		}
	},


	expected: {
		updateSubscribeButton: function(btn) {
			btn.textContent = 'Ждем вашу книгу';
			btn.setAttribute('data-status', 'waiting');
			// btn.onclick = views.expected.toExpected();
		},
		// toExpected: function() {
		//     window.location.href='/personal/basket/expected/';
		// }
	},

	// авторизация
	auth: {
		showRegistrationError: function (err) {
			$('#REGISTER_LOGIN-error').html(err).show();
		},
		showAuthorisationError: function (err) {
			$('.js__login-error').html(err).show();
		},
		hideAuthorisationError: function (err) {
			$('.js__login-error').html("").hide();
		}
	}
};


//контроллер обработки действий
var events = {
	// закрытие верхнего баннера
	hideHeaderBanner: function(banner) {
		$(banner).slideUp(400);

		// сохранить выбор пользователя
	},

	basket: {
		// добавление товара в корзину
		// по всему сайту
		// items: { book_id, cnt }
		// вызов - атрибут Onclick
		add: function(btn, items, reload) {
			if ($(btn).attr('data-status') == 'in-basket') {
				location.href = '/personal/basket/';
				return;
			}

			var params = {
				items: items,
				state: 'order'
			};

			api.basket.add(params, function(res) {

				if (res.result) { // товар добавлен
					if (btn) {
						// изменить вид кнопки
						views.basket.updateBuyButton(btn);
					}

					component.counter.update(views.basket.tabs.basket, +1);
					// отправить данные партнерам
					partners.trigger(partners.events.basket.add, {el: btn, count: 1});

					if (reload) window.location.reload();
				} else {
					views.showNotification(res.warnings[0].message);
				}
			})
		},
	},

	reserve: {
		// добавление товара в резерв
		// на странице резервирования
		// params: { book_id, cnt }
		// вызов - атрибут Onclick
		add: function(btn, params) {


				params.state = 'reserve';

				api.basket.add(params, function(res) {
					//если успешно добавился
					if (res.result) {
						window.location.reload();
					}
					// если не добавился
					else {
						views.showNotification(res.warnings[0].message);
					}
				});



		}
	},

	// добавление в ожидаемые
	expected: {
		toExpected: function() {
			window.location.href = '/personal/basket/expected/';
		},

		add: function(btn, callback) {
			var id = btn.dataset.bookId;
			if (!id) return;

			var params = {
				book_id: id
			};

			//сначала проверяем авторизацию
			events.auth.check(function () {

			    if (btn.getAttribute('data-status') == 'waiting') {
			        events.expected.toExpected();
			        return;
                }
				api.goodssubscribe.add(params, function (res) {
					if (res.result) { // успешно добавлен
						component.counter.update(views.basket.tabs.expected, 1);
						callback ? callback() : views.expected.updateSubscribeButton(btn);
					} else {
						views.showNotification(res.warnings[0].message);
					}
				});
			});
		}
	},

	auth: {
		// проверка авторизации
		// если не авторизован - попап
		// если авторизован - коллбэк
		check: function(callback) {
			api.auth.check(function(res) {
				if (res.result) {
					callback();
				} else {
					var loginPopup = Popup.getInstance('login', '.popup-login');
					loginPopup.show();
				}
			})
		},

		authorization: function (params) {
			api.auth.login(params, function (res) {
				// если успешно авторизовался
				if (res.result) {
					window.location.reload(false);
				}
				// если не авторизовался
				else {
					var errorText;
					if (res.warnings && res.warnings.length) errorText = res.warnings[0].message;
					else if (res.error_detail) errorText =  res.error_detail.message;
					else errorText = 'Что-то пошло не так';
					views.auth.showAuthorisationError(errorText);
				}
			})
		},
		registration: function (params) {
			api.auth.registration(params, function (res) {
				// если успешно зарегистрировался
				if (res.result) {
					window.location.reload(false);
				}
				// если не зарегистрировался
				else {
                    var errorText;
                    if (res.warnings && res.warnings.length) errorText = res.warnings[0].message;
                    else if (res.error_detail) errorText =  res.error_detail.message;
                    else errorText = 'Что-то пошло не так';
					views.auth.showRegistrationError(errorText);
				}
			})
		},
		resetPass: function (params) {
			api.auth.resetPass(params, function (res){
				// если успешно восстанавливается пароль
				if(res.result){
					window.location.reload(false);
				} else {
                    var errorText;
                    if (res.warnings && res.warnings.length) errorText = res.warnings[0].message;
                    else if (res.error_detail) errorText =  res.error_detail.message;
                    else errorText = 'Что-то пошло не так';
					views.auth.showRegistrationError(errorText);
				}
			});
		}
	}
};