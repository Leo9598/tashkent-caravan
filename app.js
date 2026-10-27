// TASHKENT CARAVAN (ТАШКЕНТ КАРАВАН) - GLOBAL MULTILINGUAL & SITE LOCKING ENGINE (RU, RO, EN)

document.addEventListener('DOMContentLoaded', () => {

  function readPreference(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function savePreference(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be unavailable in private browsing. */ }
  }
  let currentLang = readPreference('tashkent_language', 'ro');
  if (!['ro', 'ru', 'en'].includes(currentLang)) currentLang = 'ro';
  let cart = [];
  let currentCategory = 'all';
  let searchQuery = '';

  // Compact navigation menu for phone layouts
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const primaryNav = document.getElementById('primaryNav');
  if (mobileMenuToggle && primaryNav) {
    const closeMobileMenu = () => {
      primaryNav.classList.remove('open');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      mobileMenuToggle.setAttribute('aria-label', i18n[currentLang]?.open_navigation || 'Open navigation menu');
      mobileMenuToggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    };

    mobileMenuToggle.addEventListener('click', event => {
      event.stopPropagation();
      const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMobileMenu();
      } else {
        primaryNav.classList.add('open');
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
        mobileMenuToggle.setAttribute('aria-label', i18n[currentLang]?.close_navigation || 'Close navigation menu');
        mobileMenuToggle.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
      }
    });

    primaryNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));
    document.addEventListener('click', event => {
      if (!primaryNav.contains(event.target) && !mobileMenuToggle.contains(event.target)) closeMobileMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && mobileMenuToggle.getAttribute('aria-expanded') === 'true') {
        closeMobileMenu();
        mobileMenuToggle.focus();
      }
    });
  }

  // Keep anchor targets and sticky menu controls below the actual header height.
  const header = document.getElementById('navbar');
  if (header && 'ResizeObserver' in window) {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    }).observe(header);
  }

  // Global Site Open/Closed State (Default OPEN globally)
  let isSiteOpen = true;

  // Fetch Global Site Status from Server
  async function fetchGlobalSiteStatus() {
    try {
      const res = await fetch('/api/site-status');
      if (res.ok) {
        const data = await res.json();
        isSiteOpen = data.isOpen === true;
      }
    } catch (err) {
      console.warn('Could not fetch server status, using cached state:', err);
    }
    if (localStorage.getItem('tashkent_unlocked') === 'true') {
      isSiteOpen = true;
    }
    renderSiteStatusOverlay();
  }

  // Render Closed Overlay screen when site is locked globally
  function renderSiteStatusOverlay() {
    let closedOverlay = document.getElementById('siteClosedOverlay');

    if (!isSiteOpen && localStorage.getItem('tashkent_unlocked') !== 'true') {
      if (!closedOverlay) {
        closedOverlay = document.createElement('div');
        closedOverlay.id = 'siteClosedOverlay';
        closedOverlay.style.cssText = `
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: #0b111e;
          z-index: 99999;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 2rem; text-align: center; color: #ffffff;
        `;
        document.body.appendChild(closedOverlay);
      }

      const closedTitle = 'Site-ul nu lucrează temporar!';
      const closedSubtitle = 'Meniul online nu este disponibil în acest moment. Vă așteptăm cu drag în timpul programului de lucru.';

      closedOverlay.innerHTML = `
        <div style="max-width: 500px; background: rgba(16, 25, 44, 0.95); border: 2px solid var(--color-gold, #d4af37); border-radius: 24px; padding: 3rem 2rem; box-shadow: 0 25px 50px rgba(0,0,0,0.8);">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #a8841a, #d4af37); color: #0b111e; font-family: 'Cinzel', serif; font-size: 2rem; font-weight: 900; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">Т</div>
          <h1 style="font-family: 'Cinzel', serif; font-size: 1.8rem; color: #ffffff; margin-bottom: 1rem;">${closedTitle}</h1>
          <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 2rem; line-height: 1.6;">${closedSubtitle}</p>
          
          <div style="background: rgba(255,255,255,0.05); padding: 1.25rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 1.5rem; text-align: left;">
            <div style="color: #d4af37; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;"><i class="fa-regular fa-clock" aria-hidden="true"></i> Program (10:00 - 23:00)</div>
            <div style="color: #fff; font-size: 0.9rem;">Str. Mihai Eminescu 64, Chișinău</div>
            <div style="color: #fff; font-size: 0.9rem; margin-top: 0.25rem;">Tel: <a href="tel:078142911" style="color: #d4af37; font-weight: 700;">078 142 911</a></div>
          </div>

          <button id="adminToggleBtn" style="background: transparent; border: 1px solid rgba(212, 175, 55, 0.4); color: #d4af37; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.8rem; cursor: pointer;">
            <i class="fa-solid fa-lock-open" aria-hidden="true"></i> Deschide site-ul global (pentru proprietar)
          </button>
        </div>
      `;

      document.getElementById('adminToggleBtn').addEventListener('click', async () => {
        const pin = prompt('Introduceți codul PIN al proprietarului:');
        if (pin) {
          await toggleGlobalSiteStatus(true, pin);
        }
      });

    } else if (closedOverlay) {
      closedOverlay.remove();
    }
  }

  // Toggle Global Site Status via Server API
  async function toggleGlobalSiteStatus(targetOpen, pin) {
    try {
      const res = await fetch('/api/site-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, isOpen: targetOpen })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        isSiteOpen = targetOpen;
        if (targetOpen) {
          localStorage.setItem('tashkent_unlocked', 'true');
        } else {
          localStorage.removeItem('tashkent_unlocked');
        }
        renderSiteStatusOverlay();
        alert(targetOpen
          ? 'Site-ul a fost DESCHIS cu succes pentru toți clienții!'
          : 'Site-ul a fost ÎNCHIS cu succes! Mesajul "Site-ul nu lucrează temporar!" este afișat.');
      } else {
        alert(data.message || 'Cod PIN incorect!');
      }
    } catch (err) {
      alert('Eroare de conexiune cu serverul');
    }
  }

  // UI Translations Dictionary
  const i18n = {
    ru: {
      brand_name: 'ТАШКЕНТ',
      logo_badge: 'Т',
      nav_home: 'Главная',
      nav_menu: 'Меню',
      nav_about: 'О Нас',
      nav_contact: 'Контакты',
      btn_order: 'Заказ',
      hero_badge: 'Аутентичная Восточная Кухня',
      hero_title: 'Вкус Истинного Узбекистана',
      hero_subtitle: 'Погрузитесь в атмосферу восточной сказки. Самый ароматный плов, сочные шашлыки на углях, домашний лагман и выдержанные вина в сердце города.',
      hero_menu_btn: 'Посмотреть Меню',
      schedule_days: 'Пн - Вос (L M Mi J V S D)',
      float_plov_title: 'Фирменный Ташкентский Плов',
      float_plov_desc: 'Готовится ежедневно из свежей баранины',
      menu_subtitle: 'Наше Гастрономическое Меню',
      menu_title: 'Восточные Изысканности',
      search_placeholder: 'Поиск блюд, напитков...',
      cat_all: 'Всё Меню',
      cat_lunch: 'Бизнес-ланч',
      cat_starters: 'Холодные закуски',
      cat_salads: 'Салаты',
      cat_soups: 'Супы',
      cat_mains: 'Основные блюда',
      cat_mangal: 'Мангал',
      cat_bakery: 'Выпечка',
      cat_sides: 'Гарниры',
      cat_sauces: 'Соусы',
      cat_desserts: 'Десерты',
      cat_bar: 'Бар & Напитки',
      cat_alcohol: 'Алкогольные напитки',
      about_subtitle: 'Традиции & Гостеприимство',
      about_title: 'История Ташкент',
      about_p1: 'В узбекской культуре гость — это благословение дома. В ресторане «Ташкент» мы возрождаем вековые кулинарные традиции Великого Шёлкового пути.',
      about_p2: 'Каждое блюдо готовится по аутентичным рецептам с использованием настоящих узбекских специй (зиры, барбариса, кориандра), свежайшего мяса и авторской подачи.',
      about_stat1: 'Натуральные специи',
      about_stat2: 'Ежедневно без выходных',
      quote_text: '«Плов — это не просто еда, это дух узбекского гостеприимства и песня, исполненная на чугунном казане.»',
      quote_author: '— Шеф-повар Ташкент',
      contact_subtitle: 'Ждём Вас в Гости',
      contact_title: 'Контакты & График Работы',
      contact_address_lbl: 'Адрес:',
      contact_phone_lbl: 'Телефон:',
      contact_hours_lbl: 'График работы:',
      contact_entity_lbl: 'Юридическое лицо:',
      cart_title: 'Ваш Предзаказ',
      cart_total_lbl: 'Итого:',
      cart_send_btn: 'Отправить Заказ',
      cart_empty: 'Ваш предзаказ пуст.<br>Выберите блюда из меню!',
      btn_add_to_cart: 'В Заказ',
      currency: 'лей',
      lunch_title: 'Бизнес-ланч',
      lunch_subtitle: 'Соберите свой обед на выбор!',
      lunch_first_title: 'Первое блюдо (на выбор)',
      lunch_second_title: 'Второе блюдо (на выбор)',
      lunch_add_title: 'Дополнительно',
      lunch_bread: '½ узбекской лепёшки',
      lunch_order_btn: 'В Заказ',
      lunch_modal_title: 'Соберите свой Бизнес-ланч',
      lunch_modal_subtitle: 'Выберите 1 первое и 1 второе блюдо',
      lunch_modal_confirm: 'Добавить в Заказ',
      hero_lunch_cta: 'Бизнес-ланч • 170 лей',
      lunch_price_lbl: 'Цена:'
    },
    ro: {
      brand_name: 'TASHKENT',
      logo_badge: 'T',
      nav_home: 'Acasă',
      nav_menu: 'Meniu',
      nav_about: 'Despre Noi',
      nav_contact: 'Contacte',
      btn_order: 'Comandă',
      hero_badge: 'Bucătărie Orientală Autentică',
      hero_title: 'Gustul Adevărat al Uzbekistanului',
      hero_subtitle: 'Cufundă-te în atmosfera unei povești orientale. Cel mai aromat plov, frigărui suculente la cărbuni, lagman de casă și vinuri alese în inima orașului.',
      hero_menu_btn: 'Vezi Meniul',
      schedule_days: 'Lun - Duminică (10:00 - 23:00)',
      float_plov_title: 'Plov Special Tașkent',
      float_plov_desc: 'Preparat zilnic din carne proaspătă de berbecuț',
      menu_subtitle: 'Meniul Nostru Gastronomic',
      menu_title: 'Delicii Orientale',
      search_placeholder: 'Căutare mâncăruri, băuturi...',
      cat_all: 'Tot Meniul',
      cat_lunch: 'Business Lunch',
      cat_starters: 'Gustări Reci',
      cat_salads: 'Salate',
      cat_soups: 'Supe',
      cat_mains: 'Bucate Calde',
      cat_mangal: 'Grătar (Mangal)',
      cat_bakery: 'Patiserie',
      cat_sides: 'Garnituri',
      cat_sauces: 'Sosuri',
      cat_desserts: 'Deserturi',
      cat_bar: 'Bar & Băuturi',
      cat_alcohol: 'Băuturi Alcoolice',
      about_subtitle: 'Tradiție & Ospitalitate',
      about_title: 'Istoria Tashkent',
      about_p1: 'În cultura uzbecă, oaspetele este o binecuvântare a casei. La restaurantul „Tashkent” reînviem tradițiile culinare seculare ale Drumului Mătăsii.',
      about_p2: 'Fiecare preparat este gătit după rețete autentice, folosind condimente uzbece originale (chimen, dudițe, coriadru) și carne de cea mai înaltă calitate.',
      about_stat1: 'Condimente Naturale',
      about_stat2: 'Zilnic fără zile libere',
      quote_text: '«Plovul nu este doar mâncare, este sufletul ospitalității uzbece și o melodie cântată într-un ceaun de fontă.»',
      quote_author: '— Bucătar Șef Tashkent',
      contact_subtitle: 'Vă Așteptăm cu Drag',
      contact_title: 'Contacte & Program de Lucru',
      contact_address_lbl: 'Adresă:',
      contact_phone_lbl: 'Telefon:',
      contact_hours_lbl: 'Program de lucru:',
      contact_entity_lbl: 'Entitate juridică:',
      cart_title: 'Comanda Ta',
      cart_total_lbl: 'Total:',
      cart_send_btn: 'Trimite Comanda',
      cart_empty: 'Comanda ta este goală.<br>Alege preparate din meniu!',
      btn_add_to_cart: 'Adaugă',
      currency: 'lei',
      lunch_title: 'Business Lunch',
      lunch_subtitle: 'Compuneți prânzul la alegere!',
      lunch_first_title: 'Felul întâi (la alegere)',
      lunch_second_title: 'Felul doi (la alegere)',
      lunch_add_title: 'Suplimentar',
      lunch_bread: '½ lipie uzbecă',
      lunch_order_btn: 'În Comandă',
      lunch_modal_title: 'Compuneți Business Lunch-ul',
      lunch_modal_subtitle: 'Alegeți felul întâi și felul doi după preferință',
      lunch_modal_confirm: 'Adaugă în Comandă',
      hero_lunch_cta: 'Business Lunch • 170 lei',
      lunch_price_lbl: 'Preț:'
    },
    en: {
      brand_name: 'TASHKENT',
      logo_badge: 'T',
      nav_home: 'Home',
      nav_menu: 'Menu',
      nav_about: 'About Us',
      nav_contact: 'Contact',
      btn_order: 'Order',
      hero_badge: 'Authentic Eastern Cuisine',
      hero_title: 'The Real Taste of Uzbekistan',
      hero_subtitle: 'Immerse yourself in an oriental fairy tale. The most aromatic plov, juicy charcoal kebabs, handmade lagman, and fine wines in the heart of the city.',
      hero_menu_btn: 'Explore Menu',
      schedule_days: 'Mon - Sun (10:00 - 23:00)',
      float_plov_title: 'Signature Tashkent Plov',
      float_plov_desc: 'Prepared daily with tender fresh lamb',
      menu_subtitle: 'Our Gastronomic Menu',
      menu_title: 'Oriental Delicacies',
      search_placeholder: 'Search dishes, drinks...',
      cat_all: 'All Menu',
      cat_lunch: 'Business Lunch',
      cat_starters: 'Cold Starters',
      cat_salads: 'Salads',
      cat_soups: 'Soups',
      cat_mains: 'Main Dishes',
      cat_mangal: 'Mangal Grill',
      cat_bakery: 'Bakery',
      cat_sides: 'Side Dishes',
      cat_sauces: 'Sauces',
      cat_desserts: 'Desserts',
      cat_bar: 'Bar & Drinks',
      cat_alcohol: 'Alcoholic Drinks',
      about_subtitle: 'Tradition & Hospitality',
      about_title: 'Story of Tashkent',
      about_p1: 'In Uzbek culture, a guest is a blessing to the home. At "Tashkent", we revive centuries-old culinary traditions of the Silk Road.',
      about_p2: 'Every dish is crafted using authentic recipes, genuine Uzbek spices (cumin, barberry, coriander), and premium meats.',
      about_stat1: 'Natural Spices',
      about_stat2: 'Open Every Day',
      quote_text: '«Plov is not just food, it is the spirit of Uzbek hospitality and a song played inside a cast-iron kazan.»',
      quote_author: '— Executive Chef Tashkent',
      contact_subtitle: 'We Welcome You',
      contact_title: 'Contact & Opening Hours',
      contact_address_lbl: 'Address:',
      contact_phone_lbl: 'Phone:',
      contact_hours_lbl: 'Opening Hours:',
      contact_entity_lbl: 'Legal Entity:',
      cart_title: 'Your Pre-Order',
      cart_total_lbl: 'Total:',
      cart_send_btn: 'Send Order',
      cart_empty: 'Your pre-order is empty.<br>Select delicious items from our menu!',
      btn_add_to_cart: 'Add to Order',
      currency: 'lei',
      lunch_title: 'Business Lunch',
      lunch_subtitle: 'Build your choice of lunch!',
      lunch_first_title: 'First Course (to choice)',
      lunch_second_title: 'Second Course (to choice)',
      lunch_add_title: 'Included',
      lunch_bread: '½ Uzbek flatbread',
      lunch_order_btn: 'Add to Order',
      lunch_modal_title: 'Build Your Business Lunch',
      lunch_modal_subtitle: 'Choose your 1st and 2nd courses',
      lunch_modal_confirm: 'Add to Order',
      hero_lunch_cta: 'Business Lunch • 170 lei',
      lunch_price_lbl: 'Price:'
    }
  };

  // Interface labels are translated alongside the original restaurant content.
  Object.assign(i18n.ro, {
    welcome_title: 'Oaspetele este o binecuvântare a casei.',
    welcome_description: 'Tradițiile Drumului Mătăsii, în inima Chișinăului.',
    welcome_link: 'Descoperă povestea noastră',
    skip_menu: 'Sari la meniu', clear_search: 'Șterge', reset_filters: 'Arată tot meniul',
    menu_item: 'preparat', menu_items: 'preparate', directions: 'Indicații', close: 'Închide', view_photo: 'Vezi fotografia',
    customer_name: 'Numele Dvs.', customer_phone: 'Număr de telefon', customer_notes: 'Masa / Comentariu (opțional)',
    increase: 'Mărește cantitatea', decrease: 'Micșorează cantitatea', no_results: 'Niciun rezultat găsit',
    open_navigation: 'Deschide navigarea', close_navigation: 'Închide navigarea', categories: 'Categorii meniu'
  });
  Object.assign(i18n.ru, {
    welcome_title: 'Гость — благословение дома.',
    welcome_description: 'Традиции Шёлкового пути в самом сердце Кишинёва.',
    welcome_link: 'Откройте нашу историю',
    skip_menu: 'Перейти к меню', clear_search: 'Очистить', reset_filters: 'Показать всё меню',
    menu_item: 'позиция', menu_items: 'позиций', directions: 'Маршрут', close: 'Закрыть', view_photo: 'Посмотреть фото',
    customer_name: 'Ваше имя', customer_phone: 'Номер телефона', customer_notes: 'Столик / Комментарий (необязательно)',
    increase: 'Увеличить количество', decrease: 'Уменьшить количество', no_results: 'Ничего не найдено',
    open_navigation: 'Открыть навигацию', close_navigation: 'Закрыть навигацию', categories: 'Категории меню'
  });
  Object.assign(i18n.en, {
    welcome_title: 'A guest is a blessing to the home.',
    welcome_description: 'The traditions of the Silk Road, in the heart of Chișinău.',
    welcome_link: 'Discover our story',
    skip_menu: 'Skip to menu', clear_search: 'Clear', reset_filters: 'Show the full menu',
    menu_item: 'item', menu_items: 'items', directions: 'Directions', close: 'Close', view_photo: 'View photo',
    customer_name: 'Your name', customer_phone: 'Phone number', customer_notes: 'Table / Notes (optional)',
    increase: 'Increase quantity', decrease: 'Decrease quantity', no_results: 'No items found',
    open_navigation: 'Open navigation', close_navigation: 'Close navigation', categories: 'Menu categories'
  });

  // Full Menu Database
  const menuData = [
    // 0. БИЗНЕС-ЛАНЧ (lunch)
    {
      id: 'l1',
      category: 'lunch',
      price: 170,
      isBusinessLunch: true,
      firstCourses: {
        ru: ['Чечевичный суп', 'Шурпа с бараниной', 'Лагман', 'Куриный суп', 'Харчо'],
        ro: ['Supă de linte', 'Șurpa de berbecuț', 'Lagman', 'Supă de pui', 'Harcio'],
        en: ['Red Lentil Soup', 'Lamb Shurpa Soup', 'Lagman Noodle Soup', 'Chicken Soup', 'Kharcho Soup']
      },
      secondCourses: {
        ru: ['Плов', 'Манты с бараниной', 'Пюре с гуляшом', 'Гречка с гуляшом', 'Рис с гуляшом'],
        ro: ['Plov', 'Manti cu berbecuț', 'Piure cu gulaș', 'Hrișcă cu gulaș', 'Orez cu gulaș'],
        en: ['Uzbek Plov', 'Steamed Lamb Manti', 'Mashed Potatoes with Goulash', 'Buckwheat with Goulash', 'Rice with Goulash']
      },
      additional: {
        ru: ['½ узбекской лепёшки'],
        ro: ['½ lipie uzbecă'],
        en: ['½ Uzbek flatbread']
      },
      ru: {
        name: 'Бизнес-ланч',
        subtitle: 'Соберите свой обед на выбор!',
        tag: 'Бизнес-ланч',
        firstTitle: 'Первое блюдо (на выбор)',
        secondTitle: 'Второе блюдо (на выбор)',
        additionalTitle: 'Дополнительно',
        desc: 'Чечевичный суп, Шурпа с бараниной, Лагман, Куриный суп, Харчо • Плов, Манты с бараниной, Пюре с гуляшом, Гречка с гуляшом, Рис с гуляшом • ½ узбекской лепёшки'
      },
      ro: {
        name: 'Business Lunch',
        subtitle: 'Compuneți prânzul la alegere!',
        tag: 'Business Lunch',
        firstTitle: 'Felul întâi (la alegere)',
        secondTitle: 'Felul doi (la alegere)',
        additionalTitle: 'Suplimentar',
        desc: 'Supă de linte, Șurpa de berbecuț, Lagman, Supă de pui, Harcio • Plov, Manti cu berbecuț, Piure cu gulaș, Hrișcă cu gulaș, Orez cu gulaș • ½ lipie uzbecă'
      },
      en: {
        name: 'Business Lunch',
        subtitle: 'Build your choice of lunch!',
        tag: 'Business Lunch',
        firstTitle: 'First Course (to choice)',
        secondTitle: 'Second Course (to choice)',
        additionalTitle: 'Included',
        desc: 'Red Lentil Soup, Lamb Shurpa, Lagman, Chicken Soup, Kharcho • Uzbek Plov, Lamb Manti, Mashed Potatoes with Goulash, Buckwheat, Rice • ½ Uzbek flatbread'
      }
    },

    // 1. ХОЛОДНЫЕ ЗАКУСКИ (starters)
    { id: 'st1', category: 'starters', price: 120, weight: 150, image: 'images/babaganoush.jpg', ru: { name: 'Восточный бабагануш', desc: 'Запечённые баклажаны, тахини, чеснок, лимонный сок, оливковое масло и специи', tag: 'Закуска' }, ro: { name: 'Babaganoush Oriental', desc: 'Vinete coapte, tahini, usturoi, suc de lămâie, ulei de măsline și condimente', tag: 'Gustare' }, en: { name: 'Oriental Babaganoush', desc: 'Baked eggplants, tahini, garlic, lemon juice, olive oil, and oriental spices', tag: 'Starter' } },
    { id: 'st2', category: 'starters', price: 250, weight: 250, image: 'images/cheese_platter.jpg', ru: { name: 'Сырное плато', desc: 'Ассорти из 4 видов сыра, виноград, мёд и грецкий орех.', tag: 'Ассорти' }, ro: { name: 'Platou de Brânzeturi', desc: 'Asortiment din 4 tipuri de brânză, struguri, miere și nucă.', tag: 'Asortat' }, en: { name: 'Cheese Platter', desc: 'Assortment of 4 cheese varieties served with grapes, honey, and walnuts.', tag: 'Platter' } },
    { id: 'st3', category: 'starters', price: 200, weight: 400, image: 'images/fruit_platter.jpg', ru: { name: 'Фруктовое плато', desc: 'Ассорти сезонных фруктов', tag: 'Свежее' }, ro: { name: 'Platou de Fructe', desc: 'Asortiment de fructe de sezon', tag: 'Proaspăt' }, en: { name: 'Fruit Platter', desc: 'Assortment of fresh seasonal fruits', tag: 'Fresh' } },
    { id: 'st4', category: 'starters', price: 150, weight: 250, ru: { name: 'Овощное плато', desc: 'Свежие болгарские перцы, помидоры, огурец, лук и брынза.', tag: 'Свежее' }, ro: { name: 'Platou de Legume', desc: 'Ardei dulci proaspeți, roșii, castraveți, ceapă și brânză.', tag: 'Proaspăt' }, en: { name: 'Vegetable Platter', desc: 'Fresh bell peppers, vine tomatoes, cucumber, onion, and feta cheese.', tag: 'Fresh' } },
    { id: 'st5', category: 'starters', price: 160, weight: 200, image: 'images/pickles_platter.jpg', ru: { name: 'Соленья', desc: 'Маринованные огурцы, помидоры, капуста, морковь по-корейски, оливки и маслины.', tag: 'Домашнее' }, ro: { name: 'Murături de Casă', desc: 'Castraveți murați, roșii, varză, morcov în stil coreean, măsline verzi și negre.', tag: 'De Casă' }, en: { name: 'Home-style Pickles', desc: 'Pickled cucumbers, tomatoes, cabbage, Korean carrot salad, green and black olives.', tag: 'Homemade' } },

    // 2. САЛАТЫ (salads)
    { id: 'sal1', category: 'salads', price: 85, weight: 150, ru: { name: 'Чабан-салат', desc: 'Помидоры, огурец, болгарский перец, лук и оливковое масло.', tag: 'Свежее' }, ro: { name: 'Salată Ciobănească', desc: 'Roșii, castraveți, ardei dulce, ceapă și ulei de măsline.', tag: 'Proaspăt' }, en: { name: 'Chaban Salad', desc: 'Tomatoes, cucumber, sweet bell pepper, onion, and olive oil.', tag: 'Fresh' } },
    { id: 'sal2', category: 'salads', price: 120, weight: 150, image: 'images/greek_salad.jpg', ru: { name: 'Греческий салат', desc: 'Фета, помидоры, огурец, болгарский перец, маслины и лук.', tag: 'Классика' }, ro: { name: 'Salată Grecească', desc: 'Feta, roșii, castraveți, ardei dulce, măsline și ceapă.', tag: 'Clasic' }, en: { name: 'Greek Salad', desc: 'Feta cheese, tomatoes, cucumber, bell pepper, black olives, and onion.', tag: 'Classic' } },
    { id: 'sal3', category: 'salads', price: 80, weight: 150, image: 'images/achichuk_salad.jpg', ru: { name: 'Ачучук', desc: 'Сочные помидоры, тонко нарезанный лук и оливковое масло.', tag: 'К Плову' }, ro: { name: 'Salată Achichuk', desc: 'Roșii suculente, ceapă tăiată fin și ulei de măsline.', tag: 'Pentru Plov' }, en: { name: 'Achichuk Tomato Salad', desc: 'Juicy tomatoes, paper-thin sliced onions, and olive oil.', tag: 'Plov Pairing' } },
    { id: 'sal4', category: 'salads', price: 150, weight: 180, image: 'images/warm_salad.jpg', ru: { name: 'Тёплый салат с телятиной', desc: 'Сочная телятина, микс зелени, болгарский перец, кабачки, баклажаны и помидоры черри, дополненные кунжутом и соусом унаги.', tag: 'Теплый' }, ro: { name: 'Salată Caldă cu Vită', desc: 'Carne suculentă de vită, mix de verdeață, ardei dulce, dovlecei, vinete și roșii cherry, cu susan și sos unagi.', tag: 'Cald' }, en: { name: 'Warm Veal Salad', desc: 'Juicy tender veal, mix greens, bell pepper, zucchini, eggplant, and cherry tomatoes, topped with sesame and unagi sauce.', tag: 'Warm' } },
    { id: 'sal5', category: 'salads', price: 150, weight: 200, image: 'images/caesar_chicken.jpg', ru: { name: 'Цезарь с курицей', desc: 'Нежная куриная грудка, хрустящие листья салата, помидоры черри, перепелиные яйца, сухарики и соус «Цезарь».', tag: 'Классика' }, ro: { name: 'Salată Caesar cu Pui', desc: 'Piept de pui fraged, frunze crocante de salată, roșii cherry, ouă de prepeliță, crutoane și sos «Caesar».', tag: 'Clasic' }, en: { name: 'Chicken Caesar Salad', desc: 'Tender chicken breast, crisp lettuce leaves, cherry tomatoes, quail eggs, croutons, and Caesar dressing.', tag: 'Classic' } },

    // 3. СУПЫ (soups)
    { id: 'sup1', category: 'soups', price: 130, weight: 300, image: 'images/surpa.jpg', ru: { name: 'Шурпа из баранины', desc: 'Наваристый бульон с крупными кусочками картофеля, моркови и нежной баранины.', tag: 'Хит' }, ro: { name: 'Șurpa de Berbecuț', desc: 'Supă concentrată cu bucăți mari de cartofi, morcovi și carne fragedă de berbecuț.', tag: 'Top' }, en: { name: 'Lamb Shurpa', desc: 'Rich hearty broth with chunky potatoes, sweet carrots, and tender lamb.', tag: 'Popular' } },
    { id: 'sup2', category: 'soups', price: 130, weight: 300, image: 'images/surpa_veal.jpg', ru: { name: 'Шурпа из телятины', desc: 'Наваристый бульон с крупными кусочками картофеля, моркови и нежной телятины.', tag: 'Рекомендуем' }, ro: { name: 'Șurpa de Vită', desc: 'Supă concentrată cu bucăți mari de cartofi, morcovi și carne fragedă de vită.', tag: 'Recomandat' }, en: { name: 'Veal Shurpa', desc: 'Rich hearty broth with chunky potatoes, sweet carrots, and tender veal.', tag: 'Recommended' } },
    { id: 'sup3', category: 'soups', price: 130, weight: 200, image: 'images/lagman.jpg', ru: { name: 'Лагман', desc: 'Лапша ручной работы, нежная телятина, болгарский перец, кабачки, лук и морковь.', tag: 'Хит' }, ro: { name: 'Lagman Tradițional', desc: 'Taței făcuți manual, carne fragedă de vită, ardei dulce, dovlecei, ceapă și morcov.', tag: 'Top' }, en: { name: 'Lagman Noodle Soup', desc: 'Hand-pulled noodles, tender veal, sweet bell pepper, zucchini, onion, and carrots.', tag: 'Best Seller' } },
    { id: 'sup4', category: 'soups', price: 140, weight: 250, image: 'images/dushbera.jpg', ru: { name: 'Чучвара', desc: 'Наваристый бульон, домашские узбекские пельмени ручной работы и свежая зелень.', tag: 'Классика' }, ro: { name: 'Chuchvara (Colțunași)', desc: 'Supă concentrată, colțunași uzbeci de casă făcuți manual și verdeață proaspătă.', tag: 'Clasic' }, en: { name: 'Chuchvara Soup', desc: 'Rich broth, homemade hand-crafted Uzbek dumplings, and fresh herbs.', tag: 'Classic' } },
    { id: 'sup5', category: 'soups', price: 100, weight: 200, image: 'images/lentil_soup.jpg', ru: { name: 'Чечевичный суп', desc: 'Нежный крем-суп из красной чечевицы, моркови и картофеля со сливками. Подаётся с долькой лимона.', tag: 'Крем-суп' }, ro: { name: 'Supă de Linte', desc: 'Supă cremă delicată din linte roșie, morcov și cartofi cu smântână dulce. Servită cu felie de lămâie.', tag: 'Supă Cremă' }, en: { name: 'Red Lentil Soup', desc: 'Creamy red lentil soup with carrots, potatoes, and cream. Served with a lemon slice.', tag: 'Cream Soup' } },

    // 4. ОСНОВНЫЕ БЛЮДА (mains)
    { id: 'm1', category: 'mains', price: 150, weight: 350, image: 'images/tashkent_plov.jpg', ru: { name: 'Ташкентский плов', desc: 'Рассыпчатый рис с нежной бараниной, морковью и зирой. Подаётся с гранатом и перепелиным яйцом.', tag: 'Главный Хит' }, ro: { name: 'Plov Tașkent', desc: 'Orez bob cu bob cu carne fragedă de berbecuț, morcov și chimen. Servit cu rodie și ou de prepeliță.', tag: 'Specialitatea Casei' }, en: { name: 'Tashkent Plov', desc: 'Fluffy rice with tender lamb, carrots, and cumin. Served with pomegranate and quail egg.', tag: 'Signature Dish' } },
    { id: 'm2', category: 'mains', price: 130, weight: 350, ru: { name: 'Праздничный плов', desc: 'Ароматный рассыпчатый рис с нежной телятиной, морковью и зирой.', tag: 'Праздник' }, ro: { name: 'Plov Festiv', desc: 'Orez aromat bob cu bob cu carne fragedă de vită, morcov și chimen.', tag: 'Festiv' }, en: { name: 'Festive Holiday Plov', desc: 'Aromatic fluffy rice with tender veal, sweet carrots, and chickpeas.', tag: 'Festive' } },
    { id: 'm3', category: 'mains', price: 120, weight: 150, image: 'images/manti_lamb.jpg', ru: { name: 'Манты с телятиной', desc: 'Манты ручной работы на пару с рубленой телятиной, луком и курдюком.', tag: 'На пару' }, ro: { name: 'Manti cu Vită', desc: 'Manti făcuți manual la abur cu carne tocată de vită, ceapă și grăsime de oaie (curdiuc).', tag: 'La Abur' }, en: { name: 'Steamed Veal Manti', desc: 'Handmade steamed manti dumplings with minced veal, onions, and lamb fat.', tag: 'Steamed' } },
    { id: 'm4', category: 'mains', price: 120, weight: 150, image: 'images/manti_lamb.jpg', ru: { name: 'Манты с бараниной', desc: 'Манты ручной работы на пару с рубленой бараниной, луком и курдюком.', tag: 'На пару' }, ro: { name: 'Manti cu Berbecuț', desc: 'Manti făcuți manual la abur cu carne tocată de berbecuț, ceapă și grăsime de oaie (curdiuc).', tag: 'La Abur' }, en: { name: 'Steamed Lamb Manti', desc: 'Handmade steamed manti dumplings with minced lamb, onions, and lamb fat.', tag: 'Steamed' } },
    { id: 'm5', category: 'mains', price: 150, weight: 150, ru: { name: 'Жареные манты', desc: 'Манты ручной работы с рубленым мясом, луком и курдюком, обжаренные до золотистой корочки в казане.', tag: 'Хрустящее' }, ro: { name: 'Manti Prăjiți', desc: 'Manti făcuți manual cu carne tocată, ceapă și grăsime de oaie, prăjiți până la o crustă aurie în ceaun.', tag: 'Crocant' }, en: { name: 'Fried Manti Dumplings', desc: 'Handmade manti dumplings filled with minced meat, onions, and lamb fat, pan-fried to a golden crust in a kazan.', tag: 'Crispy' } },
    { id: 'm6', category: 'mains', price: 170, weight: 350, image: 'images/kazan_kebab.jpg', ru: { name: 'Казан-кебаб', desc: 'Томлёная баранина, румяный картофель, лук и свежая зелень.', tag: 'Хит' }, ro: { name: 'Kazan Kebab', desc: 'Carne de berbecuț înăbușită, cartofi rumeniți, ceapă și verdeață proaspătă.', tag: 'Delicios' }, en: { name: 'Kazan Kebab', desc: 'Slow-cooked lamb, crispy golden potatoes, onion, and fresh garden herbs.', tag: 'Kazan Special' } },
    { id: 'm7', category: 'mains', price: 190, weight: 400, ru: { name: 'Жаркое из баранины с овощами', desc: 'Сочная баранина, картофель, болгарский перец, лук, кабачки и баклажаны в ароматном соусе.', tag: 'Сытное' }, ro: { name: 'Friptură de Berbecuț cu Legume', desc: 'Carne suculentă de berbecuț, cartofi, ardei dulce, ceapă, dovlecei și vinete în sos aromat.', tag: 'Gustoase' }, en: { name: 'Lamb Roast with Veggies', desc: 'Juicy lamb, potatoes, bell pepper, onion, zucchini, and eggplant in savory aromatic sauce.', tag: 'Hearty' } },
    { id: 'm8', category: 'mains', price: 190, weight: 400, ru: { name: 'Жаркое из телятины с овощами', desc: 'Нежная телятина, картофель, болгарский перец, лук, кабачки и баклажаны в ароматном соусе.', tag: 'Премиум' }, ro: { name: 'Friptură de Vită cu Legume', desc: 'Carne fragedă de vită, cartofi, ardei dulce, ceapă, dovlecei și vinete în sos aromat.', tag: 'Premium' }, en: { name: 'Veal Roast with Veggies', desc: 'Tender veal, potatoes, bell pepper, onion, zucchini, and eggplant in savory aromatic sauce.', tag: 'Premium' } },
    { id: 'm9', category: 'mains', price: 200, weight: 400, image: 'images/uyghur_lagman.jpg', ru: { name: 'Уйгурский лагман', desc: 'Лапша ручной работы с нежной телятиной, кабачками, баклажанами, луком и морковью в фирменном соусе.', tag: 'Уйгурский' }, ro: { name: 'Lagman Uigur', desc: 'Taței făcuți manual cu carne fragedă de vită, dovlecei, vinete, ceapă și morcov în sosul casei.', tag: 'Uigur' }, en: { name: 'Uyghur Lagman', desc: 'Hand-pulled noodles with tender veal, zucchini, eggplant, onion, and carrots in house signature sauce.', tag: 'Uyghur' } },
    { id: 'm10', category: 'mains', price: 150, weight: 250, image: 'images/dolma.jpg', ru: { name: 'Долма', desc: 'Нежные виноградные листья, фаршированные рубленой телятиной и рисом, со специями. Подаётся со сметанно-чесночным соусом.', tag: 'Классика' }, ro: { name: 'Dolma', desc: 'Frunze delicate de viță de vie umplute cu carne de vită, orez și condimente. Servită cu sos de smântână și usturoi.', tag: 'Clasic' }, en: { name: 'Dolma', desc: 'Tender grape leaves stuffed with minced beef, rice, and oriental spices. Served with sour cream garlic sauce.', tag: 'Classic' } },

    // 5. МАНГАЛ (mangal)
    { id: 'mg1', category: 'mangal', price: 160, weight: 200, image: 'images/chicken_shashlik.jpg', ru: { name: 'Шашлык из курицы', desc: 'Сочное куриное филе, приготовленное на мангале. Подаётся с лавашем и луком.', tag: 'Мангал' }, ro: { name: 'Frigărui de Pui', desc: 'Piept de pui suculent pregătit la grătar. Servit cu lipie și ceapă.', tag: 'Grătar' }, en: { name: 'Chicken Shashlik', desc: 'Juicy chicken fillet grilled over charcoal. Served with flatbread and onion.', tag: 'Charcoal' } },
    { id: 'mg2', category: 'mangal', price: 160, weight: 200, image: 'images/veal_shashlik.jpg', ru: { name: 'Шашлык из телятины', desc: 'Нежная телятина, приготовленная на мангале. Подаётся с лавашем и луком.', tag: 'Мангал' }, ro: { name: 'Frigărui de Vită', desc: 'Carne fragedă de vită pregătită la grătar. Servită cu lipie și ceapă.', tag: 'Grătar' }, en: { name: 'Veal Shashlik', desc: 'Tender veal grilled over charcoal. Served with flatbread and onion.', tag: 'Charcoal' } },
    { id: 'mg3', category: 'mangal', price: 160, weight: 200, image: 'images/shashlik_lamb.jpg', ru: { name: 'Шашлык из баранины', desc: 'Сочная баранина, приготовленная на мангале. Подаётся с лавашем и луком.', tag: 'Мангал' }, ro: { name: 'Frigărui de Berbecuț', desc: 'Carne suculentă de berbecuț pregătită la grătar. Servită cu lipie și ceapă.', tag: 'Grătar' }, en: { name: 'Lamb Shashlik', desc: 'Juicy lamb grilled over charcoal. Served with flatbread and onion.', tag: 'Charcoal' } },
    { id: 'mg4', category: 'mangal', price: 150, weight: 180, image: 'images/lyulya_kebab.jpg', ru: { name: 'Люля-кебаб из курицы', desc: 'Рубленое куриное филе с курдюком, приготовленное на мангале. Подаётся с лавашем и луком.', tag: 'Люля' }, ro: { name: 'Lula-Kebab de Pui', desc: 'Carne tocată de pui cu grăsime de oaie pregătită la grătar. Servită cu lipie și ceapă.', tag: 'Lula' }, en: { name: 'Chicken Lyulya Kebab', desc: 'Minced chicken fillet with lamb fat, charcoal grilled. Served with flatbread and onion.', tag: 'Grilled' } },
    { id: 'mg5', category: 'mangal', price: 150, weight: 180, ru: { name: 'Люля-кебаб из телятины', desc: 'Рубленая телятина с курдюком, приготовленная на мангале. Подаётся с лавашем и луком.', tag: 'Люля' }, ro: { name: 'Lula-Kebab de Vită', desc: 'Carne tocată de vită cu grăsime de oaie pregătită la grătar. Servită cu lipie și ceapă.', tag: 'Lula' }, en: { name: 'Veal Lyulya Kebab', desc: 'Minced veal with lamb fat, charcoal grilled. Served with flatbread and onion.', tag: 'Grilled' } },
    { id: 'mg6', category: 'mangal', price: 150, weight: 180, ru: { name: 'Люля-кебаб из баранины', desc: 'Рубленая баранина с курдюком, приготовленная на мангале. Подаётся с лавашем и луком.', tag: 'Люля' }, ro: { name: 'Lula-Kebab de Berbecuț', desc: 'Carne tocată de berbecuț cu grăsime de oaie pregătită la grătar. Servită cu lipie și ceapă.', tag: 'Lula' }, en: { name: 'Lamb Lyulya Kebab', desc: 'Minced lamb with lamb fat, charcoal grilled. Served with flatbread and onion.', tag: 'Grilled' } },
    { id: 'mg7', category: 'mangal', price: 250, weight: 200, image: 'images/rack_of_lamb.jpg', ru: { name: 'Каре из баранины', desc: 'Сочные бараньи рёбра, приготовленные на мангале. Подаются с лавашем, луком и соусом.', tag: 'Премиум' }, ro: { name: 'Coaste de Berbecuț la Grătar', desc: 'Coaste suculente de berbecuț pregătite la grătar. Servite cu lipie, ceapă și sos.', tag: 'Premium' }, en: { name: 'Rack of Lamb', desc: 'Juicy lamb rack chops grilled over charcoal flame. Served with flatbread, onion, and sauce.', tag: 'Premium' } },
    { id: 'mg8', category: 'mangal', price: 150, image: 'images/crispy_fish.jpg', ru: { name: 'Хрустящая рыба', desc: 'Карп с золотистой хрустящей корочкой, обжаренный в казане. Подаётся с фирменным соусом.', tag: 'Рыба' }, ro: { name: 'Pește Crocant', desc: 'Crap crocant rumenit în ceaun cu crustă aurie. Servit cu sosul casei.', tag: 'Pește' }, en: { name: 'Crispy Fish', desc: 'Carp fried to a crispy golden crust in a kazan. Served with house sauce.', tag: 'Fish' } },
    { id: 'mg9', category: 'mangal', price: 300, image: 'images/grilled_dorado.jpg', ru: { name: 'Дорадо на мангале', desc: 'Целая дорадо, приготовленная на мангале с ароматным розмарином и дольками лимона.', tag: 'Рыба' }, ro: { name: 'Dorado la Grătar', desc: 'Dorado întreagă pregătită la grătar cu rozmarin aromat și felii de lămâie.', tag: 'Pește' }, en: { name: 'Grilled Dorado', desc: 'Whole Dorado grilled over charcoal with aromatic rosemary and lemon slices.', tag: 'Fish' } },
    { id: 'mg11', category: 'mangal', price: 160, weight: 250, ru: { name: 'Мангал-салат', desc: 'Запечённые на мангале помидоры, болгарский перец, кабачки, баклажаны и лук.', tag: 'Овощи' }, ro: { name: 'Salată la Grătar', desc: 'Roșii, ardei dulce, dovlecei, vinete și ceapă coapte la grătar.', tag: 'Legume' }, en: { name: 'Mangal Grilled Salad', desc: 'Grilled tomatoes, bell pepper, zucchini, eggplant, and onion.', tag: 'Veggies' } },
    { id: 'mg12', category: 'mangal', price: 100, weight: 200, image: 'images/grilled_veggies.jpg', ru: { name: 'Овощи на мангале', desc: 'Баклажан, кабачок, помидор и лук, приготовленные на мангале.', tag: 'Овощи' }, ro: { name: 'Legume la Grătar', desc: 'Vinete, dovlecei, roșii și ceapă pregătite la grătar.', tag: 'Legume' }, en: { name: 'Grilled Vegetables', desc: 'Eggplant, zucchini, tomato, and onion grilled over charcoal flame.', tag: 'Veggies' } },
    { id: 'mg13', category: 'mangal', price: 150, weight: 200, ru: { name: 'Печень на мангале — ПРЕДЗАКАЗ', desc: 'Сочная говяжья печень, приготовленная на мангале с ароматными специями.', tag: 'Мангал' }, ro: { name: 'Ficat la Grătar (Precomandă)', desc: 'Ficat suculent de vită pregătit la grătar cu condimente aromate.', tag: 'Grătar' }, en: { name: 'Grilled Beef Liver (Pre-order)', desc: 'Juicy beef liver grilled over charcoal with aromatic spices.', tag: 'Charcoal' } },

    // 6. ВЫПЕЧКА (bakery)
    { id: 'bk1', category: 'bakery', price: 70, weight: 170, image: 'images/samsa.jpg', ru: { name: 'Самса с бараниной', desc: 'Румяное сдобное тесто с начинкой из рубленой баранины, лука и курдюка.', tag: 'Выпечка' }, ro: { name: 'Samsa cu Berbecuț', desc: 'Aluat rumenit umplut cu carne tocată de berbecuț, ceapă și grăsime de oaie.', tag: 'Patiserie' }, en: { name: 'Lamb Samsa', desc: 'Golden pastry filled with minced lamb, onions, and lamb fat.', tag: 'Bakery' } },
    { id: 'bk2', category: 'bakery', price: 70, weight: 170, image: 'images/samsa.jpg', ru: { name: 'Самса с телятиной', desc: 'Румяное сдобное тесто с начинкой из рубленой телятины, лука и курдюка.', tag: 'Выпечка' }, ro: { name: 'Samsa cu Vită', desc: 'Aluat rumenit umplut cu carne tocată de vită, ceapă și grăsime de oaie.', tag: 'Patiserie' }, en: { name: 'Veal Samsa', desc: 'Golden pastry filled with minced veal, onions, and lamb fat.', tag: 'Bakery' } },
    { id: 'bk3', category: 'bakery', price: 60, weight: 170, image: 'images/samsa.jpg', ru: { name: 'Самса с курицей', desc: 'Румяное сдобное тесто с начинкой из нежного куриного филе, лука и курдюка.', tag: 'Выпечка' }, ro: { name: 'Samsa cu Pui', desc: 'Aluat rumenit umplut cu piept fraged de pui, ceapă și grăsime de oaie.', tag: 'Patiserie' }, en: { name: 'Chicken Samsa', desc: 'Golden pastry filled with tender chicken fillet, onions, and lamb fat.', tag: 'Bakery' } },
    { id: 'bk4', category: 'bakery', price: 45, weight: 150, image: 'images/uzbek_bread.jpg', ru: { name: 'Узбекская лепёшка', desc: 'Традиционный горячий узбекский хлеб из тандыра с кунжутом', tag: 'Хлеб' }, ro: { name: 'Lipie Uzbecă', desc: 'Pâine tradițională uzbecă caldă din tandoor cu susan', tag: 'Pâine' }, en: { name: 'Uzbek Flatbread (Tandoor)', desc: 'Traditional warm Uzbek flatbread fresh from the tandoor', tag: 'Bread' } },

    // 7. ГАРНИРЫ (sides)
    { id: 'sd1', category: 'sides', price: 70, weight: 150, image: 'images/french_fries.jpg', ru: { name: 'Картофель фри', desc: 'Хрустящий золотистый картофель фри со солью', tag: 'Гарнир' }, ro: { name: 'Cartofi Prăjiți', desc: 'Cartofi prăjiți crocanti și aurii', tag: 'Garnitură' }, en: { name: 'French Fries', desc: 'Crispy golden french fries salted to perfection', tag: 'Side' } },
    { id: 'sd2', category: 'sides', price: 120, weight: 180, image: 'images/crispy_eggplant.jpg', ru: { name: 'Хрустящие баклажаны', desc: 'Золотистые ломтики баклажана в соусе терияки и пикантном кисло-сладком соусе, с помидорами черри.', tag: 'Хит' }, ro: { name: 'Vinete Crocante', desc: 'Felii aurii de vinete în sos teriyaki și sos dulce-picant cu roșii cherry.', tag: 'Top' }, en: { name: 'Crispy Eggplants', desc: 'Golden eggplant slices in teriyaki and sweet chili sauce, served with cherry tomatoes.', tag: 'Favorite' } },
    { id: 'sd3', category: 'sides', price: 110, weight: 120, image: 'images/chicken_nuggets.jpg', ru: { name: 'Куриные наггетсы', desc: 'Сочные кусочки куриного филе в хрустящей золотистой панировке.', tag: 'Гарнир' }, ro: { name: 'Nuggets de Pui', desc: 'Bucăți suculente din piept de pui în crustă crocantă aurie.', tag: 'Garnitură' }, en: { name: 'Chicken Nuggets', desc: 'Juicy chicken fillet nuggets in a golden crispy crust.', tag: 'Side' } },

    // 7.5. СОУСЫ (sauces)
    { id: 'sc1', category: 'sauces', price: 20, ru: { name: 'Гранатовый соус «Наршараб»', desc: 'Насыщенный кисло-сладкий соус из граната. Идеально подходит к мясу, шашлыку и люля-кебабу.', tag: 'Соус' }, ro: { name: 'Sos de rodii «Narșarab»', desc: 'Sos bogat dulce-acrișor din rodie. Ideal pentru carne, frigărui și lula-kebab.', tag: 'Sos' }, en: { name: 'Pomegranate Sauce "Narsharab"', desc: 'Rich sweet and sour pomegranate sauce. Perfect pairing for meat, shashlik, and kebab.', tag: 'Sauce' } },
    { id: 'sc2', category: 'sauces', price: 20, ru: { name: 'Чесночный соус', desc: 'Нежный сливочный соус с ароматным чесноком и лёгкими пряными нотками.', tag: 'Соус' }, ro: { name: 'Sos de usturoi', desc: 'Sos fin cremos cu usturoi aromat și note ușor condimentate.', tag: 'Sos' }, en: { name: 'Garlic Sauce', desc: 'Delicate creamy sauce with aromatic garlic and subtle spice notes.', tag: 'Sauce' } },
    { id: 'sc3', category: 'sauces', price: 20, ru: { name: 'Аджика', desc: 'Острый соус из томатов, сладкого и острого перца с ароматными специями.', tag: 'Острый' }, ro: { name: 'Adjica', desc: 'Sos picant din roșii, ardei dulce și iute cu condimente aromate.', tag: 'Picant' }, en: { name: 'Adjika', desc: 'Spicy sauce made from tomatoes, sweet and hot peppers with oriental spices.', tag: 'Spicy' } },
    { id: 'sc4', category: 'sauces', price: 20, ru: { name: 'Сладкий чили', desc: 'Кисло-сладкий соус с приятной остротой. Отлично сочетается с курицей, мясом и закусками.', tag: 'Соус' }, ro: { name: 'Sweet Chili', desc: 'Sos dulce-acrișor cu o iuțeală plăcută. Se potrivește excelent cu pui, carne și gustări.', tag: 'Sos' }, en: { name: 'Sweet Chili', desc: 'Sweet and sour sauce with a gentle kick. Pairs great with chicken, meat, and appetizers.', tag: 'Sauce' } },
    { id: 'sc5', category: 'sauces', price: 20, ru: { name: 'Томатный соус', desc: 'Ароматный соус из спелых томатов с пряными травами и специями. Подходит к мясным блюдам и картофелю.', tag: 'Соус' }, ro: { name: 'Sos de roșii', desc: 'Sos aromat din roșii coapte cu ierburi condimentate. Potrivit pentru mâncăruri din carne și cartofi.', tag: 'Sos' }, en: { name: 'Tomato Sauce', desc: 'Aromatic sauce made from ripe tomatoes with herbs and spices. Great for meat dishes and potatoes.', tag: 'Sauce' } },
    { id: 'sc6', category: 'sauces', price: 20, ru: { name: 'Ткемали', desc: 'Кисло-пряный соус из алычи с зеленью и ароматными специями. Прекрасно дополняет мясо.', tag: 'Соус' }, ro: { name: 'Tkemali', desc: 'Sos acrișor-condimentat din corcodușe cu verdeață și condimente aromate. Completează de minune carnea.', tag: 'Sos' }, en: { name: 'Tkemali', desc: 'Tangy and spiced plum sauce with herbs. Perfectly complements grilled meats.', tag: 'Sauce' } },
    { id: 'sc7', category: 'sauces', price: 20, ru: { name: 'Сметанно-чесночный соус', desc: 'Нежный соус на основе сметаны с чесноком и свежей зеленью.', tag: 'Соус' }, ro: { name: 'Sos de smântână cu usturoi', desc: 'Sos delicat pe bază de smântână cu usturoi și verdeață proaspătă.', tag: 'Sos' }, en: { name: 'Sour Cream & Garlic Sauce', desc: 'Delicate sour cream based sauce with garlic and fresh garden herbs.', tag: 'Sauce' } },
    { id: 'sc8', category: 'sauces', price: 20, ru: { name: 'Острый перечно-томатный соус', desc: 'Пикантный соус из томатов и острого перца для любителей яркого и насыщенного вкуса.', tag: 'Острый' }, ro: { name: 'Sos picant de ardei și roșii', desc: 'Sos picant din roșii și ardei iute pentru iubitorii de gust intens și vibrant.', tag: 'Picant' }, en: { name: 'Spicy Pepper & Tomato Sauce', desc: 'Zesty sauce made of ripe tomatoes and hot chili peppers for bold flavor lovers.', tag: 'Spicy' } },

    // 8. ДЕСЕРТЫ (desserts)
    { id: 'ds2', category: 'desserts', price: 150, weight: 100, image: 'images/baklava.jpg', ru: { name: 'Баклава', desc: 'Традиционная восточная баклава с орехами и медовым сиропом', tag: 'Восток' }, ro: { name: 'Baclava', desc: 'Baclava tradițională orientală cu nuci și miere', tag: 'Oriental' }, en: { name: 'Baklava', desc: 'Authentic oriental sweet baklava with walnuts and honey', tag: 'Sweet' } },
    { id: 'ds3', category: 'desserts', price: 150, weight: 180, image: 'images/napoleon_cake.jpg', ru: { name: 'Наполеон', desc: 'Нежный домашний слоёный торт с заварным ванильным кремом', tag: 'Десерт' }, ro: { name: 'Tort Napoleon', desc: 'Tort foietaj delicat de casă cu cremă fină de vanilie', tag: 'Desert' }, en: { name: 'Napoleon Cake', desc: 'Classic homemade puff pastry cake layered with vanilla custard cream', tag: 'Dessert' } },

    // 9. БАР & НАПИТКИ (bar)
    // КОФЕ
    { id: 'dr1', category: 'bar', price: 45, ru: { name: 'Эспрессо', desc: 'Классический бодрящий эспрессо', tag: 'Кофе' }, ro: { name: 'Espresso', desc: 'Espresso clasic tare și aromat', tag: 'Cafea' }, en: { name: 'Espresso', desc: 'Rich and bold espresso shot', tag: 'Coffee' } },
    { id: 'dr2', category: 'bar', price: 50, ru: { name: 'Американо', desc: 'Классический чёрный кофе', tag: 'Кофе' }, ro: { name: 'Americano', desc: 'Cafea neagră clasică', tag: 'Cafea' }, en: { name: 'Americano', desc: 'Classic long black coffee', tag: 'Coffee' } },
    { id: 'dr3', category: 'bar', price: 60, ru: { name: 'Доппио', desc: 'Двойная порция крепкого эспрессо', tag: 'Кофе' }, ro: { name: 'Doppio', desc: 'Dublu espresso tare', tag: 'Cafea' }, en: { name: 'Doppio', desc: 'Double shot espresso', tag: 'Coffee' } },
    { id: 'dr4', category: 'bar', price: 60, ru: { name: 'Капучино', desc: 'Эспрессо со взбитой молочной пенкой', tag: 'Кофе' }, ro: { name: 'Cappuccino', desc: 'Espresso cu spumă fină de lapte', tag: 'Cafea' }, en: { name: 'Cappuccino', desc: 'Espresso topped with creamy frothed milk', tag: 'Coffee' } },
    { id: 'dr5', category: 'bar', price: 65, ru: { name: 'Латте', desc: 'Нежный кофе с мягким молоком', tag: 'Кофе' }, ro: { name: 'Latte', desc: 'Cafea delicată cu lapte cremos', tag: 'Cafea' }, en: { name: 'Caffè Latte', desc: 'Smooth espresso with hot milk', tag: 'Coffee' } },
    // ВОДА
    { id: 'dr27', category: 'bar', price: 35, ru: { name: 'Aquapanna 0.25 л', desc: 'Итальянская премиальная минеральная вода без газа', tag: 'Вода' }, ro: { name: 'Aquapanna 0.25L', desc: 'Apă minerală plată premium', tag: 'Apă' }, en: { name: 'Aquapanna 0.25L', desc: 'Premium still mineral water', tag: 'Water' } },
    { id: 'dr28', category: 'bar', price: 75, ru: { name: 'Aquapanna 0.75 л', desc: 'Итальянская премиальная минеральная вода без газа (0.75 л)', tag: 'Вода' }, ro: { name: 'Aquapanna 0.75L', desc: 'Apă minerală plată premium (0.75L)', tag: 'Apă' }, en: { name: 'Aquapanna 0.75L', desc: 'Premium still mineral water (0.75L)', tag: 'Water' } },
    { id: 'dr29', category: 'bar', price: 35, ru: { name: 'Sanpellegrino 0.25 л', desc: 'Итальянская минеральная газированная вода', tag: 'Вода' }, ro: { name: 'Sanpellegrino 0.25L', desc: 'Apă minerală carbogazoasă premium', tag: 'Apă' }, en: { name: 'Sanpellegrino 0.25L', desc: 'Premium sparkling mineral water', tag: 'Water' } },
    { id: 'dr30', category: 'bar', price: 75, ru: { name: 'Sanpellegrino 0.75 л', desc: 'Итальянская минеральная газированная вода (0.75 л)', tag: 'Вода' }, ro: { name: 'Sanpellegrino 0.75L', desc: 'Apă minerală carbogazoasă premium (0.75L)', tag: 'Apă' }, en: { name: 'Sanpellegrino 0.75L', desc: 'Premium sparkling mineral water (0.75L)', tag: 'Water' } },
    { id: 'dr31', category: 'bar', price: 35, ru: { name: 'Jana 0.33 л', desc: 'Артезианская природная вода', tag: 'Вода' }, ro: { name: 'Jana 0.33L', desc: 'Apă minerală plată naturală', tag: 'Apă' }, en: { name: 'Jana 0.33L', desc: 'Natural artesian still water', tag: 'Water' } },
    { id: 'dr32', category: 'bar', price: 55, ru: { name: 'Jana 0.75 л', desc: 'Артезианская природная вода (0.75 л)', tag: 'Вода' }, ro: { name: 'Jana 0.75L', desc: 'Apă minerală plată naturală (0.75L)', tag: 'Apă' }, en: { name: 'Jana 0.75L', desc: 'Natural artesian still water (0.75L)', tag: 'Water' } },
    { id: 'dr34', category: 'bar', price: 55, ru: { name: 'Jamnica 0.75 л', desc: 'Минеральная газированная вода (0.75 л)', tag: 'Вода' }, ro: { name: 'Jamnica 0.75L', desc: 'Apă minerală carbogazoasă (0.75L)', tag: 'Apă' }, en: { name: 'Jamnica 0.75L', desc: 'Sparkling mineral water (0.75L)', tag: 'Water' } },

    // АВТОРСКИЕ ЛИМОНАДЫ
    { id: 'dr36', category: 'bar', price: 85, volume: 400, ru: { name: 'Авторский лимонад: Классический', desc: 'Свежевыжатый лимонный лимонад с мятой', tag: 'Авторский лимонад' }, ro: { name: 'Limonadă Autor: Clasică', desc: 'Limonadă proaspătă cu lămâie și mentă', tag: 'Limonadă Autor' }, en: { name: 'Craft Lemonade: Classic', desc: 'Freshly squeezed lemon lemonade with mint', tag: 'Craft Lemonade' } },
    { id: 'dr36_kiwi', category: 'bar', price: 90, volume: 400, ru: { name: 'Авторский лимонад: Киви', desc: 'Освежающий лимонад с сочным киви', tag: 'Авторский лимонад' }, ro: { name: 'Limonadă Autor: Kiwi', desc: 'Limonadă răcoritoare cu kiwi suculent', tag: 'Limonadă Autor' }, en: { name: 'Craft Lemonade: Kiwi', desc: 'Refreshing craft lemonade with juicy kiwi', tag: 'Craft Lemonade' } },
    { id: 'dr39', category: 'bar', price: 90, volume: 400, ru: { name: 'Авторский лимонад: Красный', desc: 'Ягодный сочный лимонад', tag: 'Авторский лимонад' }, ro: { name: 'Limonadă Autor: Roșie', desc: 'Limonadă suculentă cu fructe de pădure', tag: 'Limonadă Autor' }, en: { name: 'Craft Lemonade: Red', desc: 'Red berry infused juicy craft lemonade', tag: 'Craft Lemonade' } },
    { id: 'dr37', category: 'bar', price: 90, volume: 400, ru: { name: 'Авторский лимонад: Мохито', desc: 'Освежающий лимонад со вкусом Мохито и мятой', tag: 'Авторский лимонад' }, ro: { name: 'Limonadă Autor: Mojito', desc: 'Limonadă răcoritoare cu aromă de Mojito și mentă', tag: 'Limonadă Autor' }, en: { name: 'Craft Lemonade: Mojito', desc: 'Refreshing Mojito styled minty craft lemonade', tag: 'Craft Lemonade' } },
    { id: 'dr38', category: 'bar', price: 90, volume: 400, ru: { name: 'Авторский лимонад: Цитрус', desc: 'Микс апельсина, грейпфрута и лимона', tag: 'Авторский лимонад' }, ro: { name: 'Limonadă Autor: Citrice', desc: 'Mix de portocale, grefon și lămâie', tag: 'Limonadă Autor' }, en: { name: 'Craft Lemonade: Citrus', desc: 'Citrus blend of orange, grapefruit, and lemon', tag: 'Craft Lemonade' } },

    // ИТАЛЬЯНСКИЕ ЛИМОНАДЫ (SANPELLEGRINO & GURA)
    { id: 'dr_sp_cle', category: 'bar', price: 45, volume: '0.33 л', ru: { name: 'SANPELLEGRINO - Clementina', desc: 'Итальянская клементиновая газировка', tag: 'Лимонад' }, ro: { name: 'SANPELLEGRINO - Clementina', desc: 'Băutură de clementină', tag: 'Limonadă' }, en: { name: 'SANPELLEGRINO - Clementina', desc: 'Italian clementine sparkling drink', tag: 'Lemonade' } },
    { id: 'dr_sp_mel', category: 'bar', price: 45, volume: '0.33 л', ru: { name: 'SANPELLEGRINO - Melograno Arancia', desc: 'Гранат и апельсин', tag: 'Лимонад' }, ro: { name: 'SANPELLEGRINO - Melograno Arancia', desc: 'Rodie și portocală', tag: 'Limonadă' }, en: { name: 'SANPELLEGRINO - Melograno Arancia', desc: 'Pomegranate & orange sparkling drink', tag: 'Lemonade' } },
    { id: 'dr_sp_arr', category: 'bar', price: 45, volume: '0.33 л', ru: { name: 'SANPELLEGRINO - Aranciata Rossa', desc: 'Красный апельсин', tag: 'Лимонад' }, ro: { name: 'SANPELLEGRINO - Aranciata Rossa', desc: 'Portocală roșie', tag: 'Limonadă' }, en: { name: 'SANPELLEGRINO - Aranciata Rossa', desc: 'Blood orange sparkling drink', tag: 'Lemonade' } },
    { id: 'dr_sp_pom', category: 'bar', price: 45, volume: '0.33 л', ru: { name: 'SANPELLEGRINO - POMPELMO', desc: 'Грейпфрутовый лимонад', tag: 'Лимонад' }, ro: { name: 'SANPELLEGRINO - POMPELMO', desc: 'Limonadă de grefon', tag: 'Limonadă' }, en: { name: 'SANPELLEGRINO - POMPELMO', desc: 'Grapefruit sparkling drink', tag: 'Lemonade' } },
    { id: 'dr_gura_cat', category: 'bar', price: 40, volume: '0.33 л', ru: { name: 'GURA CĂTINĂ - PORTOCALĂ', desc: 'Натуральный лимонад облепиха-апельсин', tag: 'Лимонад' }, ro: { name: 'GURA CĂTINĂ - PORTOCALĂ', desc: 'Limonadă naturală cătină și portocală', tag: 'Limonadă' }, en: { name: 'GURA CĂTINĂ - PORTOCALĂ', desc: 'Sea buckthorn & orange lemonade', tag: 'Lemonade' } },
    { id: 'dr_gura_par', category: 'bar', price: 40, volume: '0.33 л', ru: { name: 'GURA PARĂ-CIMBRISOR', desc: 'Натуральный лимонад груша-чабрец', tag: 'Лимонад' }, ro: { name: 'GURA PARĂ-CIMBRISOR', desc: 'Limonadă naturală pară și cimbrișor', tag: 'Limonadă' }, en: { name: 'GURA PARĂ-CIMBRISOR', desc: 'Pear & thyme lemonade', tag: 'Lemonade' } },
    { id: 'dr_gura_zme', category: 'bar', price: 40, volume: '0.33 л', ru: { name: 'GURA ZMEURĂ - LEVĂNȚICĂ', desc: 'Натуральный лимонад малина-лаванда', tag: 'Лимонад' }, ro: { name: 'GURA ZMEURĂ - LEVĂNȚICĂ', desc: 'Limonadă naturală zmeură și levănțică', tag: 'Limonadă' }, en: { name: 'GURA RASPBERRY - LAVENDER', desc: 'Raspberry & lavender lemonade', tag: 'Lemonade' } },

    // КОМПОТ
    { id: 'dr40', category: 'bar', price: 30, volume: 350, ru: { name: 'Домашний компот', desc: 'Натуральный узбекский домашний компот из сухофруктов и ягод', tag: 'Компот' }, ro: { name: 'Compot de casă', desc: 'Compot tradițional uzbec din fructe uscate și fructe de pădure', tag: 'Compot' }, en: { name: 'Homemade Compote', desc: 'Traditional Uzbek fruit compote made with dried fruits & berries', tag: 'Compote' } },

    // 10. АЛКОГОЛЬНЫЕ НАПИТКИ (alcohol)
    // КОКТЕЙЛИ (Cocktails)
    { id: 'ck1', category: 'alcohol', price: 120, ru: { name: 'Апероль Шприц (Aperol Spritz)', desc: 'Освежающий итальянский коктейль с просекко и аперолем', tag: 'Коктейль' }, ro: { name: 'Aperol Spritz', desc: 'Cocktail clasic italian răcoritor cu prosecco și aperol', tag: 'Cocktail' }, en: { name: 'Aperol Spritz', desc: 'Classic refreshing Italian cocktail with prosecco and aperol', tag: 'Cocktail' } },
    { id: 'ck6', category: 'alcohol', price: 100, ru: { name: 'Хуго (Hugo)', desc: 'Лёгкий коктейль с сиропом бузины, мятой и просекко', tag: 'Коктейль' }, ro: { name: 'Hugo', desc: 'Cocktail lejer cu sirop de soc, mentă și prosecco', tag: 'Cocktail' }, en: { name: 'Hugo', desc: 'Light refreshing aperitif with elderflower, fresh mint, and prosecco', tag: 'Cocktail' } },
    { id: 'ck7', category: 'alcohol', price: 100, ru: { name: 'Джин-тоник (Gin & Tonic)', desc: 'Классический освежающий микс джина и тоника с лаймом', tag: 'Коктейль' }, ro: { name: 'Gin & Tonic', desc: 'Mix clasic răcoritor de gin și apă tonică cu lime', tag: 'Cocktail' }, en: { name: 'Gin & Tonic', desc: 'Classic refreshing blend of premium gin and tonic water with lime', tag: 'Cocktail' } },

    // КРЕПКИЕ АЛКОГОЛЬНЫЕ НАПИТКИ (Все цены за 50 мл)
    { id: 'al1', category: 'alcohol', price: 70, ru: { name: 'Водка Finlandia (50 мл)', desc: 'Финская водка премиум-класса', tag: 'Водка (50 мл)' }, ro: { name: 'Vodcă Finlandia (50 ml)', desc: 'Vodcă finlandeză premium', tag: 'Vodcă (50 ml)' }, en: { name: 'Finlandia Vodka (50 ml)', desc: 'Premium Finnish vodka', tag: 'Vodka (50 ml)' } },
    { id: 'al_teq_cuervo_silv', category: 'alcohol', price: 85, ru: { name: 'Текила Jose Cuervo Silver (50 мл)', desc: 'Мексиканская серебряная текила', tag: 'Текила (50 мл)' }, ro: { name: 'Tequila Jose Cuervo Silver (50 ml)', desc: 'Tequila argintie mexicană', tag: 'Tequila (50 ml)' }, en: { name: 'Jose Cuervo Silver Tequila (50 ml)', desc: 'Mexican silver tequila', tag: 'Tequila (50 ml)' } },

    // РАКИЯ
    { id: 'al3', category: 'alcohol', price: 70, ru: { name: 'Ракия Сливовая (50 мл)', desc: 'Натуральный фруктовый дистиллят из слив', tag: 'Ракия (50 мл)' }, ro: { name: 'Rachiu de prune (50 ml)', desc: 'Distilat natural din prune', tag: 'Rachiu (50 ml)' }, en: { name: 'Plum Rakia (50 ml)', desc: 'Natural plum fruit spirit', tag: 'Rakia (50 ml)' } },
    { id: 'al4', category: 'alcohol', price: 70, ru: { name: 'Ракия Виноградная (50 мл)', desc: 'Натуральный виноградный дистиллят', tag: 'Ракия (50 мл)' }, ro: { name: 'Rachiu de struguri (50 ml)', desc: 'Distilat natural din struguri', tag: 'Rachiu (50 ml)' }, en: { name: 'Grape Rakia (50 ml)', desc: 'Natural grape spirit', tag: 'Rakia (50 ml)' } },
    { id: 'al5', category: 'alcohol', price: 70, ru: { name: 'Ракия Абрикосовая (50 мл)', desc: 'Ароматный дистиллят из абрикосов', tag: 'Ракия (50 мл)' }, ro: { name: 'Rachiu de caise (50 ml)', desc: 'Distilat natural din caise', tag: 'Rachiu (50 ml)' }, en: { name: 'Apricot Rakia (50 ml)', desc: 'Natural apricot fruit spirit', tag: 'Rakia (50 ml)' } },

    // ДЖИН, ВИСКИ, РОМ
    { id: 'al_gin_gordons', category: 'alcohol', price: 80, ru: { name: 'Джин Gordon’s (50 мл)', desc: 'Классический сухой джин', tag: 'Джин (50 мл)' }, ro: { name: 'Gin Gordon’s (50 ml)', desc: 'Gin sec clasic', tag: 'Gin (50 ml)' }, en: { name: 'Gordon’s Gin (50 ml)', desc: 'Classic London dry gin', tag: 'Gin (50 ml)' } },
    { id: 'al7', category: 'alcohol', price: 100, ru: { name: 'Виски Monkey Shoulder (50 мл)', desc: 'Шотландский солодовый виски', tag: 'Виски (50 мл)' }, ro: { name: 'Whisky Monkey Shoulder (50 ml)', desc: 'Whisky de malț scoțian', tag: 'Whisky (50 ml)' }, en: { name: 'Monkey Shoulder Whisky (50 ml)', desc: 'Blended malt Scotch whisky', tag: 'Whisky (50 ml)' } },

    { id: 'al8', category: 'alcohol', price: 75, ru: { name: 'Ром Black Tears Dark (50 мл)', desc: 'Пряный тёмный кубинский ром', tag: 'Ром (50 мл)' }, ro: { name: 'Rom Black Tears Dark (50 ml)', desc: 'Rom negru condimentat cubanez', tag: 'Rom (50 ml)' }, en: { name: 'Black Tears Dark Rum (50 ml)', desc: 'Spiced dark Cuban rum', tag: 'Rum (50 ml)' } },
    { id: 'al9', category: 'alcohol', price: 75, ru: { name: 'Ром Black Tears Gold (50 мл)', desc: 'Выдержанный золотой ром', tag: 'Ром (50 мл)' }, ro: { name: 'Rom Black Tears Gold (50 ml)', desc: 'Rom auriu maturat cubanez', tag: 'Rom (50 ml)' }, en: { name: 'Black Tears Gold Rum (50 ml)', desc: 'Aged golden Cuban rum', tag: 'Rum (50 ml)' } },
    { id: 'al10', category: 'alcohol', price: 75, ru: { name: 'Ром Black Tears White (50 мл)', desc: 'Светлый кубинский ром', tag: 'Ром (50 мл)' }, ro: { name: 'Rom Black Tears White (50 ml)', desc: 'Rom alb fin cubanez', tag: 'Rom (50 ml)' }, en: { name: 'Black Tears White Rum (50 ml)', desc: 'White Cuban rum', tag: 'Rum (50 ml)' } },
    { id: 'al_ron_vigia', category: 'alcohol', price: 125, ru: { name: 'Ром La Progresivă de Vigia 13 (50 мл)', desc: 'Выдержанный премиальный кубинский ром', tag: 'Ром (50 мл)' }, ro: { name: 'Rom La Progresivă de Vigia 13 (50 ml)', desc: 'Rom maturat premium cubanez', tag: 'Rom (50 ml)' }, en: { name: 'La Progresivă de Vigia 13 Rum (50 ml)', desc: 'Premium aged Cuban rum', tag: 'Rum (50 ml)' } },

    // ВИННАЯ КАРТА (Бутылки 750 мл и Бокалы 150 мл)
    // ВИНА И ИГРИСТОЕ ПО БОКАЛАМ (150 мл)
    { id: 'w_inspiro_brut_glass', category: 'alcohol', price: 70, volume: '150 мл', ru: { name: 'Inspiro Vartely Brut — 1 бокал (150 мл)', desc: 'Игристое вино брют', tag: 'Игристое вино (150 мл)' }, ro: { name: 'Inspiro Vartely Brut — 1 pahar (150 ml)', desc: 'Vin spumant brut', tag: 'Vin spumant (150 ml)' }, en: { name: 'Inspiro Vartely Brut — 1 Glass (150 ml)', desc: 'Brut sparkling wine', tag: 'Sparkling Wine (150 ml)' } },
    { id: 'w_merlot_glass', category: 'alcohol', price: 75, volume: '150 мл', ru: { name: 'Merlot — 1 бокал (150 мл)', desc: 'Красное сухое вино', tag: 'Красное вино (150 мл)' }, ro: { name: 'Merlot — 1 pahar (150 ml)', desc: 'Vin roșu sec', tag: 'Vin roșu (150 ml)' }, en: { name: 'Merlot — 1 Glass (150 ml)', desc: 'Dry red wine', tag: 'Red Wine (150 ml)' } },
    { id: 'w_chardonnay_glass', category: 'alcohol', price: 75, volume: '150 мл', ru: { name: 'Chardonnay — 1 бокал (150 мл)', desc: 'Белое сухое вино', tag: 'Белое вино (150 мл)' }, ro: { name: 'Chardonnay — 1 pahar (150 ml)', desc: 'Vin alb sec', tag: 'Vin alb (150 ml)' }, en: { name: 'Chardonnay — 1 Glass (150 ml)', desc: 'Dry white wine', tag: 'White Wine (150 ml)' } },

    // ВИНА В БУТЫЛКАХ (750 мл)
    { id: 'w_igp_pinot_noir', category: 'alcohol', price: 280, volume: '750 мл', ru: { name: 'IGP PINOT NOIR', desc: 'Красное сухое вино', tag: 'Красное вино' }, ro: { name: 'IGP PINOT NOIR', desc: 'Vin roșu sec', tag: 'Vin roșu' }, en: { name: 'IGP PINOT NOIR', desc: 'Dry red wine', tag: 'Red Wine' } },
    { id: 'w_igp_cabernet', category: 'alcohol', price: 280, volume: '750 мл', ru: { name: 'IGP CABERNET SAUVIGNON', desc: 'Красное сухое вино', tag: 'Красное вино' }, ro: { name: 'IGP CABERNET SAUVIGNON', desc: 'Vin roșu sec', tag: 'Vin roșu' }, en: { name: 'IGP CABERNET SAUVIGNON', desc: 'Dry red wine', tag: 'Red Wine' } },
    { id: 'w_igp_merlot', category: 'alcohol', price: 280, volume: '750 мл', ru: { name: 'IGP MERLOT', desc: 'Красное сухое вино', tag: 'Красное вино' }, ro: { name: 'IGP MERLOT', desc: 'Vin roșu sec', tag: 'Vin roșu' }, en: { name: 'IGP MERLOT', desc: 'Dry red wine', tag: 'Red Wine' } },
    { id: 'w_igp_chardonnay', category: 'alcohol', price: 280, volume: '750 мл', ru: { name: 'IGP CHARDONNAY', desc: 'Белое сухое вино', tag: 'Белое вино' }, ro: { name: 'IGP CHARDONNAY', desc: 'Vin alb sec', tag: 'Vin alb' }, en: { name: 'IGP CHARDONNAY', desc: 'Dry white wine', tag: 'White Wine' } },
    { id: 'w_igp_sauvignon', category: 'alcohol', price: 280, volume: '750 мл', ru: { name: 'IGP SAUVIGNON BLANC', desc: 'Белое сухое вино', tag: 'Белое вино' }, ro: { name: 'IGP SAUVIGNON BLANC', desc: 'Vin alb sec', tag: 'Vin alb' }, en: { name: 'IGP SAUVIGNON BLANC', desc: 'Dry white wine', tag: 'White Wine' } },
    { id: 'w_totem_viorica', category: 'alcohol', price: 360, volume: '750 мл', ru: { name: 'TOTEM VIORICA', desc: 'Белое сухое вино', tag: 'Белое вино' }, ro: { name: 'TOTEM VIORICA', desc: 'Vin alb sec', tag: 'Vin alb' }, en: { name: 'TOTEM VIORICA', desc: 'Dry white wine', tag: 'White Wine' } },
    { id: 'w_totem_rara', category: 'alcohol', price: 360, volume: '750 мл', ru: { name: 'TOTEM RARĂ NEAGRĂ', desc: 'Красное сухое вино', tag: 'Красное вино' }, ro: { name: 'TOTEM RARĂ NEAGRĂ', desc: 'Vin roșu sec', tag: 'Vin roșu' }, en: { name: 'TOTEM RARĂ NEAGRĂ', desc: 'Dry red wine', tag: 'Red Wine' } },
    { id: 'w_ind_malbec_rose', category: 'alcohol', price: 360, volume: '750 мл', ru: { name: 'INDIVIDO MALBEC • SYRAH', desc: 'Розовое сухое вино', tag: 'Розовое вино' }, ro: { name: 'INDIVIDO MALBEC • SYRAH', desc: 'Vin rosé sec', tag: 'Vin rosé' }, en: { name: 'INDIVIDO MALBEC • SYRAH', desc: 'Dry rosé wine', tag: 'Rosé Wine' } },
    { id: 'w_ind_traminer_sauv', category: 'alcohol', price: 360, volume: '750 мл', ru: { name: 'INDIVIDO TRAMINER • SAUVIGNON BLANC', desc: 'Белое сухое вино', tag: 'Белое вино' }, ro: { name: 'INDIVIDO TRAMINER • SAUVIGNON BLANC', desc: 'Vin alb sec', tag: 'Vin alb' }, en: { name: 'INDIVIDO TRAMINER • SAUVIGNON BLANC', desc: 'Dry white wine', tag: 'White Wine' } },
    { id: 'w_ind_pinot_chard', category: 'alcohol', price: 360, volume: '750 мл', ru: { name: 'INDIVIDO PINOT GRIS • CHARDONNAY', desc: 'Белое сухое вино', tag: 'Белое вино' }, ro: { name: 'INDIVIDO PINOT GRIS • CHARDONNAY', desc: 'Vin alb sec', tag: 'Vin alb' }, en: { name: 'INDIVIDO PINOT GRIS • CHARDONNAY', desc: 'Dry white wine', tag: 'White Wine' } },
    { id: 'w_ind_rara_malbec_syrah', category: 'alcohol', price: 360, volume: '750 мл', ru: { name: 'INDIVIDO RARĂ NEAGRĂ • MALBEC • SYRAH', desc: 'Красное сухое вино', tag: 'Красное вино' }, ro: { name: 'INDIVIDO RARĂ NEAGRĂ • MALBEC • SYRAH', desc: 'Vin roșu sec', tag: 'Vin roșu' }, en: { name: 'INDIVIDO RARĂ NEAGRĂ • MALBEC • SYRAH', desc: 'Dry red wine', tag: 'Red Wine' } },
    { id: 'w_ind_feteasca_rara', category: 'alcohol', price: 360, volume: '750 мл', ru: { name: 'INDIVIDO FETEASCĂ • RARĂ NEAGRĂ', desc: 'Красное сухое вино', tag: 'Красное вино' }, ro: { name: 'INDIVIDO FETEASCĂ • RARĂ NEAGRĂ', desc: 'Vin roșu sec', tag: 'Vin roșu' }, en: { name: 'INDIVIDO FETEASCĂ • RARĂ NEAGRĂ', desc: 'Dry red wine', tag: 'Red Wine' } },
    { id: 'w_ind_saperavi', category: 'alcohol', price: 420, volume: '750 мл', ru: { name: 'INDIVIDO SAPERAVI', desc: 'Красное сухое вино', tag: 'Красное вино' }, ro: { name: 'INDIVIDO SAPERAVI', desc: 'Vin roșu sec', tag: 'Vin roșu' }, en: { name: 'INDIVIDO SAPERAVI', desc: 'Dry red wine', tag: 'Red Wine' } },
    { id: 'w_purcari_rosu', category: 'alcohol', price: 750, volume: '750 мл', ru: { name: 'ROȘU DE PURCARI', desc: 'Премиальное красное сухое вино', tag: 'Премиум вино' }, ro: { name: 'ROȘU DE PURCARI', desc: 'Vin roșu sec premium', tag: 'Vin Premium' }, en: { name: 'ROȘU DE PURCARI', desc: 'Premium dry red wine', tag: 'Premium Wine' } },
    { id: 'w_purcari_alb', category: 'alcohol', price: 750, volume: '750 мл', ru: { name: 'ALB DE PURCARI', desc: 'Премиальное белое сухое вино', tag: 'Премиум вино' }, ro: { name: 'ALB DE PURCARI', desc: 'Vin alb sec premium', tag: 'Vin Premium' }, en: { name: 'ALB DE PURCARI', desc: 'Premium dry white wine', tag: 'Premium Wine' } },

    // ПИВО
    { id: 'br1', category: 'alcohol', price: 50, volume: '0.5 л', ru: { name: 'Пиво Львівське (0.5 л)', desc: 'Светлое фильтрованное пиво', tag: 'Пиво' }, ro: { name: 'Bere Lvivske (0.5L)', desc: 'Bere blondă filtrată', tag: 'Bere' }, en: { name: 'Lvivske Beer (0.5L)', desc: 'Light pale lager', tag: 'Beer' } },
    { id: 'br2', category: 'alcohol', price: 60, volume: '0.5 л', ru: { name: 'Пиво Carlsberg Pilsner (0.5 л)', desc: 'Классическое светлое пиво', tag: 'Пиво' }, ro: { name: 'Bere Carlsberg Pilsner (0.5L)', desc: 'Bere blondă premium', tag: 'Bere' }, en: { name: 'Carlsberg Pilsner (0.5L)', desc: 'Classic premium pilsner beer', tag: 'Beer' } },
    { id: 'br3', category: 'alcohol', price: 60, volume: '0.5 л', ru: { name: 'Пиво Львівське 1715 (0.5 л)', desc: 'Традиционное светлое пиво', tag: 'Пиво' }, ro: { name: 'Bere Lvivske 1715 (0.5L)', desc: 'Bere tradițională blondă', tag: 'Bere' }, en: { name: 'Lvivske 1715 Beer (0.5L)', desc: 'Traditional premium pale lager', tag: 'Beer' } },
    { id: 'br4', category: 'alcohol', price: 55, volume: '0.5 л', ru: { name: 'Пиво на разлив (0.5 л)', desc: 'Свежее прохладное разливное пиво', tag: 'Разливное' }, ro: { name: 'Bere la Rozetă (0.5L)', desc: 'Bere proaspătă rece la rozetă', tag: 'Bere' }, en: { name: 'Draft Beer (0.5L)', desc: 'Fresh cold draft beer', tag: 'Draft Beer' } }
  ];

  // DOM Elements
  const menuGrid = document.getElementById('menuGrid');
  const menuSearchInput = document.getElementById('menuSearchInput');
  const categoryTabs = document.getElementById('categoryTabs');

  const cartDrawer = document.getElementById('cartDrawer');
  const cartOpenBtn = document.getElementById('cartOpenBtn');
  const cartCloseBtn = document.getElementById('cartCloseBtn');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartTotalSum = document.getElementById('cartTotalSum');
  const cartCountBadge = document.getElementById('cartCountBadge');
  const langSwitcher = document.getElementById('langSwitcher');

  const clearMenuSearch = document.getElementById('clearMenuSearch');
  const cartBackdrop = document.getElementById('cartBackdrop');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const categoryKeys = { all: 'cat_all', lunch: 'cat_lunch', starters: 'cat_starters', salads: 'cat_salads', soups: 'cat_soups', mains: 'cat_mains', mangal: 'cat_mangal', bakery: 'cat_bakery', sides: 'cat_sides', sauces: 'cat_sauces', desserts: 'cat_desserts', bar: 'cat_bar', alcohol: 'cat_alcohol' };
  const escapeAttribute = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const categoryLabel = category => i18n[currentLang][categoryKeys[category]];
  const normalizeSearch = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();

  // Restore dish choices only; personal form fields are never saved.
  const savedCart = readPreference('tashkent_cart', []);
  if (Array.isArray(savedCart)) {
    cart = savedCart.slice(0, 150).flatMap(saved => {
      if (!saved || typeof saved !== 'object' || !Number.isInteger(saved.qty) || saved.qty < 1 || saved.qty > 99) return [];
      if (saved.isBusinessLunch) {
        const lunch = menuData.find(item => item.id === 'l1');
        if (!Number.isInteger(saved.firstIndex) || !Number.isInteger(saved.secondIndex) ||
            !lunch.firstCourses.ro[saved.firstIndex] || !lunch.secondCourses.ro[saved.secondIndex]) return [];
        return [{ ...saved, price: lunch.price, ru: { name: lunch.ru.name }, ro: { name: lunch.ro.name }, en: { name: lunch.en.name } }];
      }
      const item = menuData.find(item => item.id === saved.id && !item.isBusinessLunch);
      return item ? [{ ...item, qty: saved.qty }] : [];
    });
  }

  let activeDialog = null;
  let dialogReturnFocus = null;
  function openDialog(element) {
    if (activeDialog === element) return;
    if (activeDialog) closeDialog(activeDialog, false);
    dialogReturnFocus = document.activeElement;
    activeDialog = element;
    element.inert = false;
    element.setAttribute('aria-hidden', 'false');
    element.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (element === cartDrawer) cartBackdrop.hidden = false;
    document.querySelectorAll('body > nav, body > main, body > footer, .mobile-cart-bar, .skip-link').forEach(region => { region.inert = true; });
    requestAnimationFrame(() => {
      if (activeDialog === element) (element.querySelector('button, input') || element).focus({ preventScroll: true });
    });
  }
  function closeDialog(element, restoreFocus = true) {
    if (!element) return;
    element.classList.remove('active');
    element.inert = true;
    element.setAttribute('aria-hidden', 'true');
    if (element === cartDrawer) cartBackdrop.hidden = true;
    if (activeDialog === element) {
      activeDialog = null;
      document.body.style.overflow = '';
      document.querySelectorAll('body > nav, body > main, body > footer, .mobile-cart-bar, .skip-link').forEach(region => { region.inert = false; });
      if (restoreFocus && dialogReturnFocus?.isConnected) dialogReturnFocus.focus({ preventScroll: true });
    }
  }
  document.addEventListener('keydown', event => {
    if (!activeDialog) return;
    if (event.key === 'Escape') { closeDialog(activeDialog); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...activeDialog.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]')].filter(el => el.getClientRects().length);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !activeDialog.contains(document.activeElement))) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !activeDialog.contains(document.activeElement))) {
      event.preventDefault(); first?.focus();
    }
  });
  cartBackdrop.addEventListener('click', () => closeDialog(cartDrawer));

  function updateCategoryButtons() {
    categoryTabs.querySelectorAll('.tab-btn').forEach(button => {
      const category = button.dataset.category;
      button.textContent = categoryLabel(category);
      button.classList.toggle('active', category === currentCategory);
      button.setAttribute('aria-pressed', String(category === currentCategory));
      const count = document.createElement('span');
      count.className = 'category-count';
      count.setAttribute('aria-hidden', 'true');
      count.textContent = category === 'all' ? menuData.length : menuData.filter(item => item.category === category).length;
      button.appendChild(count);
    });
  }

  // The restaurant's original meal photos can still be opened at full size.
  const mealLightbox = document.createElement('div');
  mealLightbox.className = 'modal-overlay meal-lightbox';
  mealLightbox.id = 'mealPhotoOverlay';
  mealLightbox.inert = true;
  mealLightbox.setAttribute('aria-hidden', 'true');
  mealLightbox.innerHTML = `
    <div class="meal-lightbox-content" role="dialog" aria-modal="true" aria-labelledby="mealPhotoCaption" tabindex="-1">
      <button class="modal-close meal-photo-close" type="button"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
      <img id="mealPhotoImage" alt="">
      <p id="mealPhotoCaption"></p>
    </div>`;
  document.body.appendChild(mealLightbox);
  mealLightbox.querySelector('button').addEventListener('click', () => closeDialog(mealLightbox));
  mealLightbox.addEventListener('click', event => {
    if (event.target === mealLightbox) closeDialog(mealLightbox);
  });
  function openMealPhoto(source, caption) {
    const photo = document.getElementById('mealPhotoImage');
    photo.src = source;
    photo.alt = caption;
    document.getElementById('mealPhotoCaption').textContent = caption;
    openDialog(mealLightbox);
  }

  // Change Language Function
  function setLanguage(lang) {
    currentLang = lang;
    savePreference('tashkent_language', lang);
    document.documentElement.lang = lang;
    const dict = i18n[lang] || i18n.ru;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    if (menuSearchInput && dict.search_placeholder) {
      menuSearchInput.placeholder = dict.search_placeholder;
      menuSearchInput.setAttribute('aria-label', dict.search_placeholder);
    }

    const nameInput = document.getElementById('orderCustomerName');
    const phoneInput = document.getElementById('orderCustomerPhone');
    const notesInput = document.getElementById('orderNotes');
    if (nameInput) nameInput.placeholder = lang === 'ro' ? 'Numele Dvs. *' : (lang === 'en' ? 'Your Name *' : 'Ваше Имя *');
    if (phoneInput) phoneInput.placeholder = lang === 'ro' ? 'Număr de telefon (ex: 078142911) *' : (lang === 'en' ? 'Phone number (e.g. 078142911) *' : 'Номер телефона (например: 078142911) *');
    if (notesInput) notesInput.placeholder = lang === 'ro' ? 'Masa / Comentariu (opțional)' : (lang === 'en' ? 'Table / Notes (optional)' : 'Столик / Комментарий к заказу');

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === lang));
    });

    [nameInput, phoneInput, notesInput].forEach(input => input?.setAttribute('aria-label', input.placeholder));
    document.querySelectorAll('.modal-close').forEach(button => button.setAttribute('aria-label', dict.close));
    document.querySelector('.menu-sidebar').setAttribute('aria-label', dict.categories);
    document.getElementById('lunchFirstOptionsContainer').setAttribute('aria-label', dict.lunch_first_title);
    document.getElementById('lunchSecondOptionsContainer').setAttribute('aria-label', dict.lunch_second_title);
    document.querySelector('.directions-link').setAttribute('aria-label', `${dict.directions} — Google Maps`);
    mobileMenuToggle?.setAttribute('aria-label', mobileMenuToggle.getAttribute('aria-expanded') === 'true' ? dict.close_navigation : dict.open_navigation);
    updateCategoryButtons();
    renderSiteStatusOverlay();
    renderMenu();
    updateCartUI();
  }

  if (langSwitcher) {
    langSwitcher.addEventListener('click', (e) => {
      if (e.target.classList.contains('lang-btn')) {
        const lang = e.target.getAttribute('data-lang');
        setLanguage(lang);
      }
    });
  }

  function renderMenu() {
    if (!menuGrid) return;
    menuGrid.innerHTML = '';
    const dict = i18n[currentLang] || i18n.ru;

    // Center single card when viewing the lunch category
    if (currentCategory === 'lunch') {
      menuGrid.classList.add('menu-grid-lunch-focused');
    } else {
      menuGrid.classList.remove('menu-grid-lunch-focused');
    }

    const filtered = menuData.filter(item => {
      const itemLang = item[currentLang] || item.ru;
      const matchesCategory = (currentCategory === 'all') || (item.category === currentCategory);
      const matchesSearch = normalizeSearch([itemLang.name, itemLang.desc, itemLang.tag,
        ...(item.firstCourses?.[currentLang] || []), ...(item.secondCourses?.[currentLang] || [])].join(' ')).includes(normalizeSearch(searchQuery));
      return matchesCategory && matchesSearch;
    });

    document.getElementById('currentCategoryTitle').textContent = categoryLabel(currentCategory);
    document.getElementById('menuResultCount').textContent = `${filtered.length} ${filtered.length === 1 ? dict.menu_item : dict.menu_items}`;
    clearMenuSearch.hidden = searchQuery.length === 0;
    if (filtered.length === 0) {
      menuGrid.innerHTML = `<div class="menu-empty"><p>${dict.no_results}</p><button type="button" class="btn-secondary" onclick="resetMenuFilters()">${dict.reset_filters}</button></div>`;
      return;
    }

    let previousCategory = null;
    filtered.forEach(item => {
      const itemLang = item[currentLang] || item.ru;

      if (currentCategory === 'all' && item.category !== previousCategory && !item.isBusinessLunch) {
        const heading = document.createElement('h3');
        heading.className = 'menu-category-heading';
        heading.textContent = categoryLabel(item.category);
        menuGrid.appendChild(heading);
      }
      previousCategory = item.category;
      // Keep every course option visible in the business lunch offer.
      if (item.isBusinessLunch) {
        const card = document.createElement('div');
        card.className = 'menu-card lunch-card-custom';

        const firstListHtml = (item.firstCourses[currentLang] || item.firstCourses.ru).map(dish => `<li>${dish}</li>`).join('');
        const secondListHtml = (item.secondCourses[currentLang] || item.secondCourses.ru).map(dish => `<li>${dish}</li>`).join('');
        const addListHtml = (item.additional[currentLang] || item.additional.ru).map(dish => `<li>${dish}</li>`).join('');

        card.innerHTML = `
          <div class="lunch-card-body">
            <div class="lunch-card-top-row">
              <div class="lunch-tag-pill">
                <i class="fa-solid fa-tag"></i> <span>${itemLang.tag}</span>
              </div>
              <div class="lunch-price-pill">
                <span class="lunch-price-num">${item.price}</span>
                <span class="lunch-curr">${dict.currency}</span>
              </div>
            </div>

            <h3 class="lunch-card-title">${itemLang.name}</h3>
            <p class="lunch-card-subtitle">${itemLang.subtitle}</p>

            <div class="lunch-course-columns">
            <div class="lunch-course-group">
            <div class="lunch-divider">
              <span class="lunch-diamond">◇</span>
              <span>${itemLang.firstTitle}</span>
              <span class="lunch-diamond">◇</span>
            </div>
            <ul class="lunch-list">
              ${firstListHtml}
            </ul>
            </div>
            <div class="lunch-course-group">

            <div class="lunch-divider">
              <span class="lunch-diamond">◇</span>
              <span>${itemLang.secondTitle}</span>
              <span class="lunch-diamond">◇</span>
            </div>
            <ul class="lunch-list">
              ${secondListHtml}
            </ul>
            </div>
            <div class="lunch-course-group">

            <div class="lunch-divider">
              <span class="lunch-diamond">◇</span>
              <span>${itemLang.additionalTitle}</span>
              <span class="lunch-diamond">◇</span>
            </div>
            <ul class="lunch-list">
              ${addListHtml}
            </ul>
            </div>
            </div>
          </div>

          <div class="lunch-card-footer">
            <span class="lunch-brand">Tashkent</span>
            <button class="btn-lunch-order" onclick="openLunchBuilderModal()">
              <i class="fa-solid fa-plus"></i> <span>${dict.lunch_order_btn || (currentLang === 'ro' ? 'În Comandă' : (currentLang === 'en' ? 'Add to Order' : 'В Заказ'))}</span>
            </button>
          </div>
        `;
        menuGrid.appendChild(card);
        return;
      }

      const card = document.createElement('div');
      card.className = 'menu-card';

      const inlineTagHtml = itemLang.tag ? `<span class="inline-tag-badge">${itemLang.tag}</span>` : '';

      const weightUnit = currentLang === 'ru' ? 'г' : 'g';
      const volumeUnit = currentLang === 'ru' ? 'мл' : 'ml';

      let portionText = '';
      if (item.weight) {
        portionText = `${item.weight} ${weightUnit}`;
      } else if (item.volume) {
        portionText = typeof item.volume === 'number' ? `${item.volume} ${volumeUnit}` : item.volume;
      }

      card.innerHTML = `
        <div class="card-body">
          ${inlineTagHtml}
          <div class="card-top">
            <div>
              <h3 class="card-title">${itemLang.name}</h3>
              ${portionText ? `<span style="font-size: 0.8rem; color: var(--color-gold); font-weight: 600; display: inline-flex; align-items: center; gap: 4px; margin-top: 3px;"><i class="fa-solid ${item.volume ? 'fa-glass-water' : 'fa-scale-balanced'}" style="font-size: 0.75rem;"></i>${portionText}</span>` : ''}
            </div>
            <span class="card-price">${item.price} ${dict.currency}</span>
          </div>
          <p class="card-desc">${itemLang.desc}</p>
        </div>
        <div class="card-footer">
          <span style="font-size: 0.82rem; color: var(--color-text-muted); display: inline-flex; align-items: center; gap: 4px;">
            ${portionText ? `<i class="fa-solid fa-utensils" style="color: var(--color-gold); font-size: 0.75rem;"></i> Tashkent` : 'Tashkent'}
          </span>
          <button class="btn-add-item" onclick="addToCart('${item.id}')" aria-label="${escapeAttribute(`${dict.btn_add_to_cart}: ${itemLang.name}`)}">
            <i class="fa-solid fa-plus"></i> ${dict.btn_add_to_cart}
          </button>
        </div>
      `;
      if (item.image) {
        const photoButton = document.createElement('button');
        photoButton.type = 'button';
        photoButton.className = 'card-image-wrapper';
        photoButton.setAttribute('aria-label', `${dict.view_photo}: ${itemLang.name}`);
        photoButton.setAttribute('aria-haspopup', 'dialog');
        const photo = document.createElement('img');
        photo.src = item.image;
        photo.alt = itemLang.name;
        photo.loading = 'lazy';
        photo.decoding = 'async';
        photo.className = 'card-img';
        photoButton.appendChild(photo);
        const zoomHint = document.createElement('span');
        zoomHint.className = 'meal-photo-zoom';
        zoomHint.setAttribute('aria-hidden', 'true');
        zoomHint.innerHTML = '<i class="fa-solid fa-magnifying-glass-plus"></i>';
        photoButton.appendChild(zoomHint);
        photoButton.addEventListener('click', () => openMealPhoto(item.image, itemLang.name));
        card.prepend(photoButton);
      }
      menuGrid.appendChild(card);
    });
  }

  function selectCategory(category, scroll = false) {
    currentCategory = category;
    updateCategoryButtons();
    renderMenu();
    if (scroll) document.querySelector('.menu-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  categoryTabs.addEventListener('click', event => {
    const button = event.target.closest('.tab-btn');
    if (button) selectCategory(button.dataset.category, true);
  });
  menuSearchInput.addEventListener('input', event => {
    searchQuery = event.target.value;
    renderMenu();
  });
  clearMenuSearch.addEventListener('click', () => {
    searchQuery = '';
    menuSearchInput.value = '';
    renderMenu();
    menuSearchInput.focus();
  });
  window.resetMenuFilters = () => {
    searchQuery = '';
    menuSearchInput.value = '';
    selectCategory('all');
    menuSearchInput.focus();
  };

  // Business Lunch Builder Functions
  let selectedFirstDishIndex = 0;
  let selectedSecondDishIndex = 0;

  window.openLunchBuilderModal = function () {
    const lunchItem = menuData.find(m => m.id === 'l1');
    if (!lunchItem) return;

    const firstOptionsContainer = document.getElementById('lunchFirstOptionsContainer');
    const secondOptionsContainer = document.getElementById('lunchSecondOptionsContainer');
    const modalOverlay = document.getElementById('lunchModalOverlay');

    if (!firstOptionsContainer || !secondOptionsContainer || !modalOverlay) return;

    const firstList = lunchItem.firstCourses[currentLang] || lunchItem.firstCourses.ru;
    const secondList = lunchItem.secondCourses[currentLang] || lunchItem.secondCourses.ru;

    selectedFirstDishIndex = 0;
    selectedSecondDishIndex = 0;

    firstOptionsContainer.innerHTML = firstList.map((dish, idx) => `
      <label class="lunch-option-card ${idx === 0 ? 'selected' : ''}">
        <input type="radio" name="lunch-first" value="${idx}" ${idx === 0 ? 'checked' : ''} onchange="selectLunchFirst(${idx})">
        <span class="lunch-option-title">${dish}</span>
      </label>
    `).join('');

    secondOptionsContainer.innerHTML = secondList.map((dish, idx) => `
      <label class="lunch-option-card ${idx === 0 ? 'selected' : ''}">
        <input type="radio" name="lunch-second" value="${idx}" ${idx === 0 ? 'checked' : ''} onchange="selectLunchSecond(${idx})">
        <span class="lunch-option-title">${dish}</span>
      </label>
    `).join('');

    openDialog(modalOverlay);
  };

  window.closeLunchBuilderModal = function () {
    const modalOverlay = document.getElementById('lunchModalOverlay');
    closeDialog(modalOverlay);
  };

  window.selectLunchFirst = function (idx) {
    selectedFirstDishIndex = idx;
    const cards = document.querySelectorAll('#lunchFirstOptionsContainer .lunch-option-card');
    cards.forEach((c, i) => c.classList.toggle('selected', i === idx));
  };

  window.selectLunchSecond = function (idx) {
    selectedSecondDishIndex = idx;
    const cards = document.querySelectorAll('#lunchSecondOptionsContainer .lunch-option-card');
    cards.forEach((c, i) => c.classList.toggle('selected', i === idx));
  };

  window.confirmLunchToCart = function () {
    const lunchItem = menuData.find(m => m.id === 'l1');
    if (!lunchItem) return;

    const firstList = lunchItem.firstCourses[currentLang] || lunchItem.firstCourses.ru;
    const secondList = lunchItem.secondCourses[currentLang] || lunchItem.secondCourses.ru;
    const breadList = lunchItem.additional[currentLang] || lunchItem.additional.ru;

    const firstDish = firstList[selectedFirstDishIndex] || firstList[0];
    const secondDish = secondList[selectedSecondDishIndex] || secondList[0];
    const bread = breadList[0] || (currentLang === 'ro' ? '½ lipie uzbecă' : (currentLang === 'en' ? '½ Uzbek flatbread' : '½ узбекской лепёшки'));

    const summary = `${firstDish} + ${secondDish} + ${bread}`;

    const existing = cart.find(c => c.isBusinessLunch && c.firstIndex === selectedFirstDishIndex && c.secondIndex === selectedSecondDishIndex);
    if (existing) {
      existing.qty = Math.min(99, existing.qty + 1);
    } else {
      cart.push({
        id: 'lunch_' + Date.now(),
        isBusinessLunch: true,
        firstIndex: selectedFirstDishIndex,
        secondIndex: selectedSecondDishIndex,
        price: lunchItem.price,
        qty: 1,
        selectedFirst: firstDish,
        selectedSecond: secondDish,
        selectedSummary: summary,
        ru: { name: 'Бизнес-ланч' },
        ro: { name: 'Business Lunch' },
        en: { name: 'Business Lunch' }
      });
    }

    closeLunchBuilderModal();
    updateCartUI();
    if (cartDrawer) openDialog(cartDrawer);
  };

  window.showLunchCategory = function (e) {
    if (e) e.preventDefault();
    searchQuery = '';
    menuSearchInput.value = '';
    selectCategory('lunch');
    document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
  };

  // Close lunch modal on clicking outside
  const lunchModalOverlay = document.getElementById('lunchModalOverlay');
  if (lunchModalOverlay) {
    lunchModalOverlay.addEventListener('click', (e) => {
      if (e.target === lunchModalOverlay) {
        closeLunchBuilderModal();
      }
    });
  }

  window.addToCart = function (id) {
    if (id === 'l1') {
      openLunchBuilderModal();
      return;
    }

    const item = menuData.find(m => m.id === id);
    if (!item) return;

    const existing = cart.find(c => c.id === id);
    if (existing) {
      existing.qty = Math.min(99, existing.qty + 1);
    } else {
      cart.push({ ...item, qty: 1 });
    }

    updateCartUI();
    if (cartDrawer) openDialog(cartDrawer);
  };

  function updateCartUI() {
    if (!cartItemsList) return;
    cartItemsList.innerHTML = '';
    const dict = i18n[currentLang] || i18n.ru;
    let total = 0;
    let count = 0;

    if (cart.length === 0) {
      cartItemsList.innerHTML = `
        <p style="text-align: center; color: var(--color-text-muted); margin-top: 2rem;">
          ${dict.cart_empty}
        </p>
      `;
    } else {
      cart.forEach((item, index) => {
        const itemLang = item[currentLang] || item.ru;
        total += item.price * item.qty;
        count += item.qty;
        const weightUnit = currentLang === 'ru' ? 'г' : 'g';
        const volumeUnit = currentLang === 'ru' ? 'мл' : 'ml';
        let portionStr = '';
        if (item.weight) {
          portionStr = ` (${item.weight} ${weightUnit})`;
        } else if (item.volume) {
          portionStr = ` (${typeof item.volume === 'number' ? `${item.volume} ${volumeUnit}` : item.volume})`;
        }

        if (item.isBusinessLunch) {
          const lunch = menuData.find(dish => dish.id === 'l1');
          item.selectedSummary = `${lunch.firstCourses[currentLang][item.firstIndex]} + ${lunch.secondCourses[currentLang][item.secondIndex]} + ${lunch.additional[currentLang][0]}`;
        }
        const detailsHtml = item.selectedSummary ? `
          <div style="font-size: 0.78rem; color: var(--color-teal-accent); margin-top: 2px; line-height: 1.3;">
            <i class="fa-solid fa-check" style="font-size: 0.7rem;"></i> ${item.selectedSummary}
          </div>
        ` : '';

        const cartRow = document.createElement('div');
        cartRow.className = 'cart-item';
        cartRow.innerHTML = `
          <div>
            <strong style="color: #fff; display: block; font-size: 0.95rem;">${itemLang.name}${portionStr}</strong>
            ${detailsHtml}
            <span style="color: var(--color-gold); font-size: 0.85rem;">${item.price} ${dict.currency} × ${item.qty}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button class="qty-button" data-cart-index="${index}" data-delta="-1" onclick="changeCartQty(${index}, -1)" aria-label="${escapeAttribute(`${dict.decrease}: ${itemLang.name}`)}">−</button>
            <span style="color: #fff; font-size: 0.9rem;">${item.qty}</span>
            <button class="qty-button" data-cart-index="${index}" data-delta="1" onclick="changeCartQty(${index}, 1)" aria-label="${escapeAttribute(`${dict.increase}: ${itemLang.name}`)}">+</button>
          </div>
        `;
        cartItemsList.appendChild(cartRow);
      });
    }

    savePreference('tashkent_cart', cart.map(item => ({ id: item.id, qty: item.qty, ...(item.isBusinessLunch ? { isBusinessLunch: true, firstIndex: item.firstIndex, secondIndex: item.secondIndex } : {}) })));

    if (cartTotalSum) cartTotalSum.textContent = `${total} ${dict.currency}`;
    if (cartCountBadge) cartCountBadge.textContent = count;

    // Mobile Floating Bottom Cart Bar Updates
    const mobileCartBar = document.getElementById('mobileCartBar');
    const mobileCartCount = document.getElementById('mobileCartCount');
    const mobileCartTotal = document.getElementById('mobileCartTotal');

    if (count > 0) {
      if (mobileCartBar) mobileCartBar.classList.add('active');
      if (mobileCartCount) {
        const word = currentLang === 'ro' ? (count === 1 ? '1 produs' : `${count} produse`) : (currentLang === 'en' ? (count === 1 ? '1 item' : `${count} items`) : (count === 1 ? '1 блюдо' : `${count} блюд`));
        mobileCartCount.textContent = word;
      }
      if (mobileCartTotal) mobileCartTotal.textContent = `${total} ${dict.currency}`;
    } else {
      if (mobileCartBar) mobileCartBar.classList.remove('active');
    }
  }

  window.changeCartQty = function (index, delta) {
    if (!cart[index] || (delta > 0 && cart[index].qty >= 99)) return;
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
    updateCartUI();
    const nextIndex = Math.min(index, cart.length - 1);
    const nextControl = cartItemsList.querySelector(`[data-cart-index="${nextIndex}"][data-delta="${delta}"]`);
    (nextControl || cartCloseBtn).focus({ preventScroll: true });
  };

  if (cartOpenBtn && cartDrawer) cartOpenBtn.addEventListener('click', () => openDialog(cartDrawer));
  if (cartCloseBtn && cartDrawer) cartCloseBtn.addEventListener('click', () => closeDialog(cartDrawer));

  const mobileCartOpenBtn = document.getElementById('mobileCartOpenBtn');
  if (mobileCartOpenBtn && cartDrawer) {
    mobileCartOpenBtn.addEventListener('click', () => openDialog(cartDrawer));
  }

  // Send Order to Telegram Bot API
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      const dict = i18n[currentLang] || i18n.ru;

      if (cart.length === 0) {
        alert(dict.cart_empty ? dict.cart_empty.replace(/<br\s*\/?>/gi, ' ') : 'Coșul este gol!');
        return;
      }

      const nameInput = document.getElementById('orderCustomerName');
      const phoneInput = document.getElementById('orderCustomerPhone');
      const notesInput = document.getElementById('orderNotes');

      const name = nameInput ? nameInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const notes = notesInput ? notesInput.value.trim() : '';

      if (!name || !phone) {
        alert(currentLang === 'ro' 
          ? 'Vă rugăm să introduceți numele și numărul de telefon!' 
          : (currentLang === 'en' ? 'Please enter your name and phone number!' : 'Пожалуйста, укажите Ваше имя и номер телефона!'));
        if (!name && nameInput) nameInput.focus();
        else if (!phone && phoneInput) phoneInput.focus();
        return;
      }

      let totalSum = 0;
      cart.forEach(item => { totalSum += item.price * item.qty; });

      const originalBtnHtml = checkoutBtn.innerHTML;
      checkoutBtn.disabled = true;
      checkoutBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${currentLang === 'ro' ? 'Se trimite...' : (currentLang === 'en' ? 'Sending...' : 'Отправка...')}`;

      try {
        const res = await fetch('/api/send-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cart,
            total: totalSum,
            name,
            phone,
            notes
          })
        });

        const data = await res.json();

        if (res.ok && data.status === 'success') {
          alert(currentLang === 'ro'
            ? 'Comanda Dvs. a fost trimisă cu succes! Vă vom contacta în curând pentru confirmare.'
            : (currentLang === 'en'
              ? 'Your order has been sent successfully! We will contact you shortly.'
              : 'Ваш заказ успешно отправлен! Мы свяжемся с вами в ближайшее время.'));

          cart = [];
          updateCartUI();
          if (nameInput) nameInput.value = '';
          if (phoneInput) phoneInput.value = '';
          if (notesInput) notesInput.value = '';
          if (cartDrawer) closeDialog(cartDrawer);
        } else {
          alert(data.message || 'Eroare la trimiterea comenzii în Telegram.');
        }
      } catch (err) {
        console.error('Error sending order to Telegram:', err);
        alert('Eroare de conexiune cu serverul. Vă rugăm să sunați la 078 142 911 pentru a plasa comanda.');
      } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = originalBtnHtml;
      }
    });
  }

  // Secret Owner Toggle: Tap Logo 5 Times to Turn Site ON or OFF Globally
  const brandLogo = document.getElementById('brandLogoLink');
  let clickCount = 0;
  if (brandLogo) {
    brandLogo.addEventListener('click', async (e) => {
      clickCount++;
      if (clickCount >= 5) {
        e.preventDefault();
        clickCount = 0;
        const targetState = !isSiteOpen;
        const actionStr = targetState ? 'DESCHIDE (Porniți)' : 'ÎNCHIDE (Opriți)';
        const pin = prompt(`ADMINISTRARE GLOBALĂ SITE:\nDoriți să ${actionStr} site-ul pentru toți clienții?\nIntroduceți codul PIN al proprietarului:`);
        if (pin) {
          await toggleGlobalSiteStatus(targetState, pin);
        }
      }
    });
  }

  // Initial Load: Fetch global status from Vercel Serverless API
  fetchGlobalSiteStatus();
  setLanguage(currentLang);
});
