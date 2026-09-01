// TASHKENT CARAVAN (ТАШКЕНТ КАРАВАН) - GLOBAL MULTILINGUAL & SITE LOCKING ENGINE (RU, RO, EN)

document.addEventListener('DOMContentLoaded', () => {

  let currentLang = 'ro';
  let cart = [];
  let currentCategory = 'all';
  let searchQuery = '';

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
            <div style="color: #d4af37; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;">🕒 Program (10:00 - 23:00)</div>
            <div style="color: #fff; font-size: 0.9rem;">Str. Mihai Eminescu 64, Chișinău</div>
            <div style="color: #fff; font-size: 0.9rem; margin-top: 0.25rem;">Tel: <a href="tel:078142910" style="color: #d4af37; font-weight: 700;">078 142 910</a></div>
          </div>

          <button id="adminToggleBtn" style="background: transparent; border: 1px solid rgba(212, 175, 55, 0.4); color: #d4af37; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.8rem; cursor: pointer;">
            🔓 Deschide site-ul global (pentru proprietar)
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
          ? '🟢 Site-ul a fost DESCHIS cu succes pentru toți clienții!' 
          : '🔴 Site-ul a fost ÎNCHIS cu succes! Mesajul "Site-ul nu lucrează temporar!" este afișat.');
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
      cat_desserts: 'Десерты',
      cat_bar: 'Бар & Напитки',
      cat_alcohol: 'Алкогольные напитки',
      about_subtitle: 'Традиции & Гостеприимство',
      about_title: 'История Ташкент Караван',
      about_p1: 'В узбекской культуре гость — это благословение дома. В ресторане «Ташкент Караван» мы возрождаем вековые кулинарные традиции Великого Шёлкового пути.',
      about_p2: 'Каждое блюдо готовится по аутентичным рецептам с использованием настоящих узбекских специй (зиры, барбариса, кориандра), свежайшего мяса и авторской подачи.',
      about_stat1: 'Натуральные специи',
      about_stat2: 'Ежедневно без выходных',
      quote_text: '«Плов — это не просто еда, это дух узбекского гостеприимства и песня, исполненная на чугунном казане.»',
      quote_author: '— Шеф-повар Ташкент Караван',
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
      currency: 'лей'
    },
    ro: {
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
      currency: 'lei'
    },
    en: {
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
      currency: 'lei'
    }
  };

  // Full Menu Database
  const menuData = [
    // 0. БИЗНЕС-ЛАНЧ (lunch)
    { id: 'l1', category: 'lunch', price: 170, image: 'images/tashkent_plov.jpg', ru: { name: 'Бизнес-ланч: Понедельник', desc: '• Чечевичный суп\n• Ташкентский плов\n• Узбекская лепёшка\n• Чай', tag: 'Понедельник' }, ro: { name: 'Business Lunch: Luni', desc: '• Supă de linte\n• Plov Tașkent\n• Lipie uzbecă\n• Ceai', tag: 'Luni' }, en: { name: 'Business Lunch: Monday', desc: '• Red Lentil Soup\n• Tashkent Plov\n• Uzbek Flatbread\n• Tea', tag: 'Monday' } },
    { id: 'l2', category: 'lunch', price: 170, image: 'images/surpa_veal.jpg', ru: { name: 'Бизнес-ланч: Вторник', desc: '• Шурпа с телятиной\n• Манты с телятиной\n• Узбекская лепёшка\n• Домашний компот', tag: 'Вторник' }, ro: { name: 'Business Lunch: Marți', desc: '• Șurpa cu vită\n• Manti cu vită\n• Lipie uzbecă\n• Compot de casă', tag: 'Marți' }, en: { name: 'Business Lunch: Tuesday', desc: '• Veal Surpa Soup\n• Steamed Veal Manti\n• Uzbek Flatbread\n• Homemade Compote', tag: 'Tuesday' } },
    { id: 'l3', category: 'lunch', price: 170, image: 'images/lagman.jpg', ru: { name: 'Бизнес-ланч: Среда', desc: '• Лагман\n• Рис с гуляшом\n• Узбекская лепёшка\n• Домашний лимонад', tag: 'Среда' }, ro: { name: 'Business Lunch: Miercuri', desc: '• Lagman\n• Orez cu gulaș\n• Lipie uzbecă\n• Limonadă de casă', tag: 'Miercuri' }, en: { name: 'Business Lunch: Wednesday', desc: '• Lagman Noodle Soup\n• Rice with Goulash\n• Uzbek Flatbread\n• Homemade Lemonade', tag: 'Wednesday' } },
    { id: 'l4', category: 'lunch', price: 170, image: 'images/surpa.jpg', ru: { name: 'Бизнес-ланч: Четверг', desc: '• Шурпа с бараниной\n• Манты с бараниной\n• Узбекская лепёшка\n• Зелёный чай', tag: 'Четверг' }, ro: { name: 'Business Lunch: Joi', desc: '• Șurpa cu berbecuț\n• Manti cu berbecuț\n• Lipie uzbecă\n• Ceai verde', tag: 'Business Lunch: Thursday', desc: '• Lamb Surpa Soup\n• Steamed Lamb Manti\n• Uzbek Flatbread\n• Green Tea', tag: 'Thursday' } },
    { id: 'l5', category: 'lunch', price: 170, image: 'images/holiday_plov.jpg', ru: { name: 'Бизнес-ланч: Пятница', desc: '• Чечевичный суп\n• Праздничный плов\n• Узбекская лепёшка\n• Компот из сухофруктов', tag: 'Пятница' }, ro: { name: 'Business Lunch: Vineri', desc: '• Supă de linte\n• Plov festiv\n• Lipie uzbecă\n• Compot din fructe uscate', tag: 'Vineri' }, en: { name: 'Business Lunch: Friday', desc: '• Red Lentil Soup\n• Festive Holiday Plov\n• Uzbek Flatbread\n• Dried Fruit Compote', tag: 'Friday' } },

    // 1. ХОЛОДНЫЕ ЗАКУСКИ (starters)
    { id: 'st1', category: 'starters', price: 120, image: 'images/babaganoush.jpg', ru: { name: 'Восточный бабагануш', desc: 'Запечённые баклажаны, тахини, чеснок, лимонный сок, оливковое масло и специи', tag: 'Закуска' }, ro: { name: 'Babaganoush Oriental', desc: 'Vinete coapte, tahini, usturoi, suc de lămâie, ulei de măsline și condimente', tag: 'Gustare' }, en: { name: 'Oriental Babaganoush', desc: 'Baked eggplants, tahini, garlic, lemon juice, olive oil, and oriental spices', tag: 'Starter' } },
    { id: 'st2', category: 'starters', price: 250, image: 'images/cheese_platter.jpg', ru: { name: 'Сырное плато', desc: 'Ассорти отборных сыров', tag: 'Ассорти' }, ro: { name: 'Platou de Brânzeturi', desc: 'Asortiment de brânzeturi alese', tag: 'Asortat' }, en: { name: 'Cheese Platter', desc: 'Assortment of selected fine cheeses', tag: 'Platter' } },
    { id: 'st3', category: 'starters', price: 200, image: 'images/fruit_platter.jpg', ru: { name: 'Фруктовое плато', desc: 'Ассорти сезонных фруктов', tag: 'Свежее' }, ro: { name: 'Platou de Fructe', desc: 'Asortiment de fructe de sezon', tag: 'Proaspăt' }, en: { name: 'Fruit Platter', desc: 'Assortment of fresh seasonal fruits', tag: 'Fresh' } },
    { id: 'st4', category: 'starters', price: 150, image: 'images/veggie_platter.jpg', ru: { name: 'Овощное плато', desc: 'Ассорти свежих овощей и зелени', tag: 'Свежее' }, ro: { name: 'Platou de Legume', desc: 'Asortiment de legume proaspete', tag: 'Proaspăt' }, en: { name: 'Vegetable Platter', desc: 'Platter of crisp fresh garden vegetables', tag: 'Fresh' } },
    { id: 'st5', category: 'starters', price: 160, image: 'images/pickles_platter.jpg', ru: { name: 'Соленья', desc: 'Ассорти домашних солений', tag: 'Домашнее' }, ro: { name: 'Murături de Casă', desc: 'Asortiment de murături de casă', tag: 'De Casă' }, en: { name: 'Home-style Pickles', desc: 'Assortment of house-made pickles', tag: 'Homemade' } },

    // 2. САЛАТЫ (salads)
    { id: 'sal1', category: 'salads', price: 85, image: 'images/chaban_salad.jpg', ru: { name: 'Чабан', desc: 'Свежие сочные огурцы, томаты, зелень и сладкий репчатый лук', tag: 'Свежее' }, ro: { name: 'Salată Ciobănească', desc: 'Castraveți proaspeți, roșii, verdeață și ceapă dulce', tag: 'Proaspăt' }, en: { name: 'Chaban Salad', desc: 'Crisp fresh cucumbers, vine tomatoes, red onions, and garden herbs', tag: 'Fresh' } },
    { id: 'sal2', category: 'salads', price: 120, image: 'images/greek_salad.jpg', ru: { name: 'Греческий салат', desc: 'Свежие овощи, сыр фета, маслины и оливковое масло', tag: 'Классика' }, ro: { name: 'Salată Grecească', desc: 'Legume proaspete, brânză feta, măsline și ulei de măsline', tag: 'Clasic' }, en: { name: 'Greek Salad', desc: 'Crisp vegetables, Greek feta cheese, olives, and extra virgin olive oil', tag: 'Classic' } },
    { id: 'sal3', category: 'salads', price: 80, image: 'images/achichuk_salad.jpg', ru: { name: 'Ачучук', desc: 'Тончайше нарезанные томаты с луком — традиционное дополнение к плову', tag: 'К Плову' }, ro: { name: 'Salată Achichuk', desc: 'Roșii tăiate foarte fin cu ceapă — acompaniamentul perfect pentru plov', tag: 'Pentru Plov' }, en: { name: 'Achichuk Tomato Salad', desc: 'Paper-thin sliced tomatoes and red onions, traditional pairing for Plov', tag: 'Plov Pairing' } },
    { id: 'sal4', category: 'salads', price: 150, image: 'images/warm_salad.jpg', ru: { name: 'Тёплый салат', desc: 'Тёплый салат с сочной обжаренной телятиной, овощами-гриль и кунжутным соусом', tag: 'Теплый' }, ro: { name: 'Salată Caldă', desc: 'Salată caldă cu carne de vită rumeniți, legume la grătar și sos de susan', tag: 'Cald' }, en: { name: 'Warm Beef Salad', desc: 'Warm salad with seared beef strips, grilled vegetables, and sesame dressing', tag: 'Warm' } },
    { id: 'sal5', category: 'salads', price: 150, image: 'images/caesar_chicken.jpg', ru: { name: 'Цезарь с курицей', desc: 'Хрустящий салат романо, запечённая куриная грудка, пармезан и соус Цезарь', tag: 'Классика' }, ro: { name: 'Salată Caesar cu Pui', desc: 'Frunze de romano, piept de pui grilat, parmezan și sos Caesar', tag: 'Clasic' }, en: { name: 'Chicken Caesar Salad', desc: 'Crisp romaine lettuce, grilled chicken breast, parmesan, and Caesar dressing', tag: 'Classic' } },
    { id: 'sal6', category: 'salads', price: 170, image: 'images/caesar_shrimp.jpg', ru: { name: 'Цезарь с креветками', desc: 'Сочные обжаренные креветки, салат романо, пармезан и соус Цезарь', tag: 'Премиум' }, ro: { name: 'Salată Caesar cu Creveți', desc: 'Creveți suculenți la grătar, frunze de romano, parmezan și sos Caesar', tag: 'Premium' }, en: { name: 'Shrimp Caesar Salad', desc: 'Grilled tiger prawns, crisp romaine lettuce, parmesan, and Caesar dressing', tag: 'Premium' } },

    // 3. СУПЫ (soups)
    { id: 'sup1', category: 'soups', price: 130, image: 'images/surpa.jpg', ru: { name: 'Шурпа с бараниной', desc: 'Традиционный наваристый бульон из баранины с крупными овощами и зеленью', tag: 'Хит' }, ro: { name: 'Șurpa cu Berbecuț', desc: 'Supă tradițională din carne de berbecuț cu legume proaspete și verdeață', tag: 'Top' }, en: { name: 'Lamb Surpa Soup', desc: 'Traditional rich lamb broth with chunky garden vegetables and fresh herbs', tag: 'Popular' } },
    { id: 'sup2', category: 'soups', price: 130, image: 'images/surpa_veal.jpg', ru: { name: 'Шурпа с телятиной', desc: 'Наваристый прозрачный бульон с нежной телятиной, картофелем и морковью', tag: 'Рекомендуем' }, ro: { name: 'Șurpa cu Vită', desc: 'Supă limpede din carne de mânzat cu cartofi și morcovi', tag: 'Recomandat' }, en: { name: 'Veal Surpa Soup', desc: 'Rich clear broth with tender veal, potatoes, and sweet carrots', tag: 'Recommended' } },
    { id: 'sup3', category: 'soups', price: 130, image: 'images/lagman.jpg', ru: { name: 'Лагман', desc: 'Аутентичная тянутая вручную лапша с сочным мясом и овощами в соусе', tag: 'Хит' }, ro: { name: 'Lagman Tradițional', desc: 'Taței tradiționali făcuți manual cu carne suculentă și legume în sos', tag: 'Top' }, en: { name: 'Lagman Noodle Soup', desc: 'Authentic hand-pulled noodles with savory beef & fresh vegetables in broth', tag: 'Best Seller' } },
    { id: 'sup4', category: 'soups', price: 140, image: 'images/dushbera.jpg', ru: { name: 'Чучвара', desc: 'Миниатюрные домашние узбекские пельмени в прозрачном пряном бульоне', tag: 'Классика' }, ro: { name: 'Chuchvara (Colțunași)', desc: 'Colțunași speciali uzbeci în supă limpede și aromată', tag: 'Clasic' }, en: { name: 'Chuchvara Soup', desc: 'Delicate mini Uzbek meat dumplings served in clear aromatic broth', tag: 'Classic' } },
    { id: 'sup5', category: 'soups', price: 100, image: 'images/lentil_soup.jpg', ru: { name: 'Чечевичный суп', desc: 'Нежный крем-суп из красной чечевицы со специями и долькой лимона', tag: 'Крем-суп' }, ro: { name: 'Supă de Linte', desc: 'Supă cremă delicată de linte roșie cu condimente și lămâie', tag: 'Supă Cremă' }, en: { name: 'Red Lentil Soup', desc: 'Creamy red lentil soup with aromatic oriental spices and fresh lemon', tag: 'Cream Soup' } },

    // 4. ОСНОВНЫЕ БЛЮДА (mains)
    { id: 'm1', category: 'mains', price: 150, image: 'images/tashkent_plov.jpg', ru: { name: 'Ташкентский плов', desc: 'Король восточного стола: рис, баранина, жёлтая морковь, нут и зира', tag: 'Главный Хит' }, ro: { name: 'Plov Tașkent', desc: 'Regele bucătăriei uzbece: orez special, berbecuț, morcov galben și chimen', tag: 'Specialitatea Casei' }, en: { name: 'Tashkent Plov Pilaf', desc: 'The crown jewel: aromatic rice, tender lamb, yellow carrots, and cumin', tag: 'Signature Dish' } },
    { id: 'm2', category: 'mains', price: 130, image: 'images/holiday_plov.jpg', ru: { name: 'Праздничный плов', desc: 'Традиционный узбекский праздничный плов с телятиной, изюмом и нутом', tag: 'Праздник' }, ro: { name: 'Plov Festiv', desc: 'Plov uzbec festiv cu carne de vită, stafide și năut', tag: 'Festiv' }, en: { name: 'Festive Holiday Plov', desc: 'Traditional festive Uzbek plov with tender beef, raisins, and chickpeas', tag: 'Festive' } },
    { id: 'm3', category: 'mains', price: 120, image: 'images/steamed_manti.jpg', ru: { name: 'Манты с телятиной', desc: 'Сочные паровые узбекские манты с рубленым мясом телятины и луком', tag: 'На пару' }, ro: { name: 'Manti cu Vită', desc: 'Colțunași mari uzbeci la abur cu carne de mânzat și ceapă', tag: 'La Abur' }, en: { name: 'Steamed Veal Manti', desc: 'Large steamed Uzbek dumplings filled with spiced minced veal and onions', tag: 'Steamed' } },
    { id: 'm4', category: 'mains', price: 120, image: 'images/manti_lamb.jpg', ru: { name: 'Манты с бараниной', desc: 'Паровые манты с рубленой бараниной, курдюком и восточными специями', tag: 'На пару' }, ro: { name: 'Manti cu Berbecuț', desc: 'Colțunași la abur umpluți cu carne de berbecuț și condimente oriental', tag: 'La Abur' }, en: { name: 'Steamed Lamb Manti', desc: 'Steamed dumplings stuffed with chopped lamb and oriental spices', tag: 'Steamed' } },
    { id: 'm5', category: 'mains', price: 130, image: 'images/fried_manti.jpg', ru: { name: 'Жареные манты', desc: 'Хрустящие обжаренные манты с золотистой корочкой и сочной начинкой', tag: 'Хрустящее' }, ro: { name: 'Manti Prăjiți', desc: 'Colțunași prăjiți crocanți cu umplutură suculentă de carne', tag: 'Crocant' }, en: { name: 'Fried Manti Dumplings', desc: 'Crispy pan-fried dumplings with juicy savory meat filling', tag: 'Crispy' } },
    { id: 'm6', category: 'mains', price: 140, image: 'images/kazan_kebab.jpg', ru: { name: 'Казан-кебаб', desc: 'Обжаренные до корочки бараньи рёбра с румяным картофелем из казана', tag: 'Хит' }, ro: { name: 'Kazan Kebab', desc: 'Coaste de berbecuț rumenite la ceaun cu cartofi aurii', tag: 'Delicios' }, en: { name: 'Kazan Kebab', desc: 'Crispy fried lamb ribs served with golden potatoes straight from the kazan', tag: 'Kazan Special' } },
    { id: 'm7', category: 'mains', price: 190, image: 'images/beef_roast.jpg', ru: { name: 'Жаркое из баранины с овощами', desc: 'Сочная баранина, томлённая с картофелем, луком и перцем', tag: 'Сытное' }, ro: { name: 'Friptură de Berbecuț cu Legume', desc: 'Carne fragedă de berbecuț înăbușită cu cartofi și legume', tag: 'Gustoase' }, en: { name: 'Lamb Roast with Veggies', desc: 'Tender lamb slow-cooked with spiced potatoes, onions, and bell peppers', tag: 'Hearty' } },
    { id: 'm8', category: 'mains', price: 190, image: 'images/beef_roast.jpg', ru: { name: 'Жаркое из телятины с овощами', desc: 'Нежнейшая вырезка телятины с запечёнными сезонными овощами', tag: 'Премиум' }, ro: { name: 'Friptură de Vită cu Legume', desc: 'Carne fragedă de mânzat coaptă cu legume de sezon', tag: 'Premium' }, en: { name: 'Veal Roast with Veggies', desc: 'Succulent veal strips roasted with roasted garlic and seasonal vegetables', tag: 'Premium' } },
    { id: 'm9', category: 'mains', price: 200, image: 'images/lagman.jpg', ru: { name: 'Уйгурский лагман', desc: 'Густой уйгурский сай из телятины и хрустящих овощей с длинной лапшой', tag: 'Уйгурский' }, ro: { name: 'Lagman Uigur', desc: 'Lagman uigur bogat cu carne de vită și legume proaspete', tag: 'Uigur' }, en: { name: 'Uyghur Lagman', desc: 'Rich Uyghur sauce with tender beef and crisp veggies over hand-pulled noodles', tag: 'Uyghur' } },
    { id: 'm10', category: 'mains', price: 190, image: 'images/fried_lagman.jpg', ru: { name: 'Жареный лагман', desc: 'Обжаренная ручная лапша с телятиной, болгарским перцем и специями', tag: 'Жареное' }, ro: { name: 'Lagman Prăjit', desc: 'Taței prăjiți de casă cu carne de vită, ardei dulce și condimente', tag: 'Prăjit' }, en: { name: 'Fried Lagman Noodles', desc: 'Pan-fried hand-pulled noodles with beef tenderloin and sweet peppers', tag: 'Pan-Fried' } },

    // 5. МАНГАЛ (mangal)
    { id: 'mg1', category: 'mangal', price: 160, image: 'images/chicken_shashlik.jpg', ru: { name: 'Шашлык из курицы', desc: 'Сочное куриное филе, маринованное в специях и обжаренное на углях', tag: 'Мангал' }, ro: { name: 'Frigărui de Pui', desc: 'Frigărui suculent din piept de pui marinat și fript la grătar', tag: 'Grătar' }, en: { name: 'Chicken Shashlik', desc: 'Juicy chicken breast skewer marinated and charcoal-grilled', tag: 'Charcoal' } },
    { id: 'mg2', category: 'mangal', price: 160, image: 'images/shashlik_lamb.jpg', ru: { name: 'Шашлык из телятины', desc: 'Отборная телятина, обжаренная на углях с репчатым луком и зирой', tag: 'Мангал' }, ro: { name: 'Frigărui de Vită', desc: 'Bucăți suculente de vită marinate și frapte la grătar', tag: 'Grătar' }, en: { name: 'Veal Shashlik', desc: 'Tender marinated veal cubes grilled over open charcoal embers', tag: 'Charcoal' } },
    { id: 'mg3', category: 'mangal', price: 160, image: 'images/shashlik_lamb.jpg', ru: { name: 'Шашлык из баранины', desc: 'Нежная баранина с ароматом дымка, зиры и свежим маринованным луком', tag: 'Мангал' }, ro: { name: 'Frigărui de Berbecuț', desc: 'Carne fragedă de berbecuț cu aromă de fum și condimente', tag: 'Grătar' }, en: { name: 'Lamb Shashlik', desc: 'Succulent lamb skewers infused with cumin, garlic, and smoke', tag: 'Charcoal' } },
    { id: 'mg4', category: 'mangal', price: 150, image: 'images/lyulya_kebab.jpg', ru: { name: 'Люля-кебаб из курицы', desc: 'Нежный рубленый фарш из куриного филе, приготовленный на мангале', tag: 'Люля' }, ro: { name: 'Lula-Kebab de Pui', desc: 'Carne tocată de pui cu verdeață pregătită la grătar', tag: 'Lula' }, en: { name: 'Chicken Lyulya Kebab', desc: 'Minced chicken breast skewered and charcoal-grilled with herbs', tag: 'Grilled' } },
    { id: 'mg5', category: 'mangal', price: 150, image: 'images/lyulya_kebab.jpg', ru: { name: 'Люля-кебаб из телятины', desc: 'Сочный люля-кебаб из отборной телятины со свежей зеленью на углях', tag: 'Люля' }, ro: { name: 'Lula-Kebab de Vită', desc: 'Lula-kebab din carne tocată de vită pregătit la grătar', tag: 'Lula' }, en: { name: 'Veal Lyulya Kebab', desc: 'Ground beef tenderloin kebab seasoned with herbs and charcoal-grilled', tag: 'Grilled' } },
    { id: 'mg6', category: 'mangal', price: 150, image: 'images/lyulya_kebab.jpg', ru: { name: 'Люля-кебаб из баранины', desc: 'Классический люля-кебаб из баранины с луком, зеленью и кориандром', tag: 'Люля' }, ro: { name: 'Lula-Kebab de Berbecuț', desc: 'Lula-kebab tradițional din carne de berbecuț cu condimente', tag: 'Lula' }, en: { name: 'Lamb Lyulya Kebab', desc: 'Traditional ground lamb kebab seasoned with coriander and grilled', tag: 'Grilled' } },
    { id: 'mg7', category: 'mangal', price: 190, image: 'images/rack_of_lamb.jpg', ru: { name: 'Каре из баранины', desc: 'Сочные бараньи пистолетики, запечённые на мангале с восточными травами', tag: 'Премиум' }, ro: { name: 'Coaste de Berbecuț la Grătar', desc: 'Coaste de berbecuț suculente coapte la grătar cu ierburi', tag: 'Premium' }, en: { name: 'Rack of Lamb', desc: 'Grilled rack of lamb chops roasted over open charcoal flame', tag: 'Premium' } },
    { id: 'mg8', category: 'mangal', price: 150, image: 'images/crispy_fish.jpg', ru: { name: 'Хрустящая рыба', desc: 'Хрустящая рыбка с золотистой корочкой, подаётся с долькой лимона', tag: 'Рыба' }, ro: { name: 'Pește Crocant', desc: 'Pește crocant rumenit cu crustă aurie, servit cu lămâie', tag: 'Pește' }, en: { name: 'Crispy Fish', desc: 'Golden fried crispy whole fish served with lemon slice', tag: 'Fish' } },
    { id: 'mg9', category: 'mangal', price: 250, image: 'images/grilled_dorado.jpg', ru: { name: 'Дорадо на мангале', desc: 'Цельная дорадо, приготовленная на мангале с лимоном и розмарином', tag: 'Рыба' }, ro: { name: 'Dorado la Grătar', desc: 'Pește Dorado întreg pregătit la grătar cu lămâie', tag: 'Pește' }, en: { name: 'Grilled Dorado', desc: 'Whole Dorado fish charcoal-grilled with lemon and herb oil', tag: 'Fish' } },
    { id: 'mg10', category: 'mangal', price: 300, image: 'images/salmon_steak.jpg', ru: { name: 'Сёмга на мангале', desc: 'Сочный стейк из сёмги на углях с ароматом лимона и специями', tag: 'Деликатес' }, ro: { name: 'Somon la Grătar', desc: 'Struc de somon suculent fript la grătar cu lămâie', tag: 'Delicatesă' }, en: { name: 'Grilled Salmon Steak', desc: 'Charcoal grilled salmon steak served with lemon and herbs', tag: 'Delicacy' } },
    { id: 'mg11', category: 'mangal', price: 160, image: 'images/warm_salad.jpg', ru: { name: 'Мангал-салат', desc: 'Запечённые на мангале баклажаны, перцы и томаты с чесноком и зеленью', tag: 'Овощи' }, ro: { name: 'Salată la Grătar', desc: 'Salată din vinete, ardei și roșii coapte la grătar cu usturoi', tag: 'Legume' }, en: { name: 'Mangal Grilled Salad', desc: 'Roasted grilled vegetable salad with eggplant, sweet peppers, and garlic', tag: 'Veggies' } },
    { id: 'mg12', category: 'mangal', price: 150, image: 'images/grilled_veggies.jpg', ru: { name: 'Овощи на мангале', desc: 'Ассорти овощей на углях: баклажан, цукини, томаты, перец и грибы', tag: 'Овощи' }, ro: { name: 'Legume la Grătar', desc: 'Legume la grătar: vinete, dovlecei, roșii, ardei și ciuperci', tag: 'Legume' }, en: { name: 'Grilled Vegetables', desc: 'Charcoal-grilled seasonal vegetables skewer', tag: 'Veggies' } },

    // 6. ВЫПЕЧКА (bakery)
    { id: 'bk1', category: 'bakery', price: 70, image: 'images/samsa.jpg', ru: { name: 'Самса с бараниной', desc: 'Хрустящее слоёное тесто с начинкой из сочной рубленой баранины и лука', tag: 'Выпечка' }, ro: { name: 'Samsa cu Berbecuț', desc: 'Samsa crocantă din aluat foietaj umplută cu carne de berbecuț', tag: 'Patiserie' }, en: { name: 'Lamb Samsa', desc: 'Crispy puff pastry Samsa filled with spiced chopped lamb and onion', tag: 'Bakery' } },
    { id: 'bk2', category: 'bakery', price: 70, image: 'images/samsa.jpg', ru: { name: 'Самса с телятиной', desc: 'Ароматная тандырная самса с сочной рубленой телятиной и специями', tag: 'Выпечка' }, ro: { name: 'Samsa cu Vită', desc: 'Samsa tradițională din aluat foietaj umplută cu carne de vită', tag: 'Patiserie' }, en: { name: 'Veal Samsa', desc: 'Traditional baked Samsa pastry stuffed with seasoned minced beef', tag: 'Bakery' } },
    { id: 'bk3', category: 'bakery', price: 60, image: 'images/samsa.jpg', ru: { name: 'Самса с курицей', desc: 'Нежная самса из слоёного теста с куриным филе и восточными специями', tag: 'Выпечка' }, ro: { name: 'Samsa cu Pui', desc: 'Samsa delicioasă umplută cu piept de pui și condimente', tag: 'Patiserie' }, en: { name: 'Chicken Samsa', desc: 'Golden puff pastry Samsa with savory chicken filling', tag: 'Bakery' } },
    { id: 'bk4', category: 'bakery', price: 30, image: 'images/uzbek_bread.jpg', ru: { name: 'Узбекская лепёшка', desc: 'Традиционный горячий узбекский хлеб из тандыра с кунжутом', tag: 'Хлеб' }, ro: { name: 'Lipie Uzbecă', desc: 'Pâine tradițională uzbecă caldă din tandoor cu susan', tag: 'Pâine' }, en: { name: 'Uzbek Flatbread (Tandoor)', desc: 'Traditional warm Uzbek flatbread fresh from the tandoor', tag: 'Bread' } },

    // 7. ГАРНИРЫ (sides)
    { id: 'sd1', category: 'sides', price: 70, image: 'images/french_fries.jpg', ru: { name: 'Картофель фри', desc: 'Хрустящий золотистый картофель фри со солью', tag: 'Гарнир' }, ro: { name: 'Cartofi Prăjiți', desc: 'Cartofi prăjiți crocanti și aurii', tag: 'Garnitură' }, en: { name: 'French Fries', desc: 'Crispy golden french fries salted to perfection', tag: 'Side' } },
    { id: 'sd2', category: 'sides', price: 95, image: 'images/crispy_eggplant.jpg', ru: { name: 'Хрустящие баклажаны', desc: 'Хрустящие ломтики баклажанов в кисло-сладком соусе с зеленью', tag: 'Хит' }, ro: { name: 'Vinete Crocante', desc: 'Vinete crocante în sos dulce-acrișor cu verdeață', tag: 'Top' }, en: { name: 'Crispy Eggplants', desc: 'Crispy fried eggplant cubes in sweet chili sauce with cilantro', tag: 'Favorite' } },
    { id: 'sd3', category: 'sides', price: 110, image: 'images/chicken_nuggets.jpg', ru: { name: 'Куриные наггетсы', desc: 'Сочные кусочки куриного филе в хрустящей панировке', tag: 'Гарнир' }, ro: { name: 'Nuggets de Pui', desc: 'Nuggets suculente de pui în crustă crocantă', tag: 'Garnitură' }, en: { name: 'Chicken Nuggets', desc: 'Crispy golden fried chicken nuggets', tag: 'Side' } },

    // 8. ДЕСЕРТЫ (desserts)
    { id: 'ds1', category: 'desserts', price: 80, image: 'images/ice_cream.jpg', ru: { name: 'Мороженое', desc: 'Ассорти сливочного мороженого с ягодным соусом', tag: 'Десерт' }, ro: { name: 'Înghețată', desc: 'Inghețată asortată cu sos de fructe de pădure', tag: 'Desert' }, en: { name: 'Ice Cream', desc: 'Assorted cream ice cream scoops with berry sauce', tag: 'Dessert' } },
    { id: 'ds2', category: 'desserts', price: 100, image: 'images/baklava.jpg', ru: { name: 'Баклава', desc: 'Традиционная восточная баклава с орехами и медовым сиропом', tag: 'Восток' }, ro: { name: 'Baclava', desc: 'Baclava tradițională orientală cu nuci și miere', tag: 'Oriental' }, en: { name: 'Baklava', desc: 'Authentic oriental sweet baklava with walnuts and honey', tag: 'Sweet' } },
    { id: 'ds3', category: 'desserts', price: 110, image: 'images/napoleon_cake.jpg', ru: { name: 'Наполеон', desc: 'Домашний торт Наполеон со заварным ванильным кремом', tag: 'Торт' }, ro: { name: 'Tort Napoleon', desc: 'Tort de casă Napoleon cu cremă fină de vanilie', tag: 'Tort' }, en: { name: 'Napoleon Cake', desc: 'Classic home-style flaky Napoleon cake with vanilla custard', tag: 'Cake' } },
    { id: 'ds4', category: 'desserts', price: 140, image: 'images/raspberry_strudel.jpg', ru: { name: 'Малиновый штрудель', desc: 'Тёплый штрудель с сочной малиной и шариком мороженого', tag: 'Теплое' }, ro: { name: 'Ștrudel cu Zmeură', desc: 'Ștrudel cald cu zmeură suculentă și înghețată', tag: 'Cald' }, en: { name: 'Raspberry Strudel', desc: 'Warm raspberry strudel served with a scoop of vanilla ice cream', tag: 'Warm' } },

    // 9. БАР & НАПИТКИ (bar)
    // КОФЕ
    { id: 'dr1', category: 'bar', price: 45, ru: { name: 'Эспрессо', desc: 'Классический бодрящий эспрессо', tag: 'Кофе' }, ro: { name: 'Espresso', desc: 'Espresso clasic tare și aromat', tag: 'Cafea' }, en: { name: 'Espresso', desc: 'Rich and bold espresso shot', tag: 'Coffee' } },
    { id: 'dr2', category: 'bar', price: 50, ru: { name: 'Американо', desc: 'Классический чёрный кофе', tag: 'Кофе' }, ro: { name: 'Americano', desc: 'Cafea neagră clasică', tag: 'Cafea' }, en: { name: 'Americano', desc: 'Classic long black coffee', tag: 'Coffee' } },
    { id: 'dr3', category: 'bar', price: 60, ru: { name: 'Доппио', desc: 'Двойная порция крепкого эспрессо', tag: 'Кофе' }, ro: { name: 'Doppio', desc: 'Dublu espresso tare', tag: 'Cafea' }, en: { name: 'Doppio', desc: 'Double shot espresso', tag: 'Coffee' } },
    { id: 'dr4', category: 'bar', price: 60, ru: { name: 'Капучино', desc: 'Эспрессо со взбитой молочной пенкой', tag: 'Кофе' }, ro: { name: 'Cappuccino', desc: 'Espresso cu spumă fină de lapte', tag: 'Cafea' }, en: { name: 'Cappuccino', desc: 'Espresso topped with creamy frothed milk', tag: 'Coffee' } },
    { id: 'dr5', category: 'bar', price: 65, ru: { name: 'Латте', desc: 'Нежный кофе с мягким молоком', tag: 'Кофе' }, ro: { name: 'Latte', desc: 'Cafea delicată cu lapte cremos', tag: 'Cafea' }, en: { name: 'Caffè Latte', desc: 'Smooth espresso with steamed fresh milk', tag: 'Coffee' } },
    { id: 'dr6', category: 'bar', price: 80, ru: { name: 'Раф кофе', desc: 'Сливочный десертный кофе с ванилью', tag: 'Кофе' }, ro: { name: 'Raf Coffee', desc: 'Cafea cremoasă cu frișcă și vanilie', tag: 'Cafea' }, en: { name: 'Raf Coffee', desc: 'Creamy dessert coffee with vanilla', tag: 'Coffee' } },

    // ХОЛОДНЫЙ КОФЕ
    { id: 'dr7', category: 'bar', price: 65, ru: { name: 'Айс Латте', desc: 'Освежающий холодный латте со льдом', tag: 'Холодный кофе' }, ro: { name: 'Ice Latte', desc: 'Latte rece și răcoritor cu gheață', tag: 'Cafea rece' }, en: { name: 'Iced Latte', desc: 'Chilled espresso with cold milk over ice', tag: 'Cold Coffee' } },
    { id: 'dr8', category: 'bar', price: 80, ru: { name: 'Бамбл кофе (Bumble)', desc: 'Слоистый микс эспрессо и апельсинового сока со льдом', tag: 'Холодный кофе' }, ro: { name: 'Bumble Coffee', desc: 'Mix în straturi de espresso și suc de portocale cu gheață', tag: 'Cafea rece' }, en: { name: 'Bumble Coffee', desc: 'Layered espresso with orange juice over ice', tag: 'Cold Coffee' } },
    { id: 'dr9', category: 'bar', price: 85, ru: { name: 'Айс Раф', desc: 'Освежающий сливочно-ванильный раф со льдом', tag: 'Холодный кофе' }, ro: { name: 'Ice Raf', desc: 'Raf cremós rece cu frișcă și gheață', tag: 'Cafea rece' }, en: { name: 'Iced Raf', desc: 'Chilled creamy vanilla Raf coffee over ice', tag: 'Cold Coffee' } },

    // ЧАЙ
    { id: 'dr10', category: 'bar', price: 55, ru: { name: 'Чёрный чай', desc: 'Ароматный листовой чёрный чай в чайнике', tag: 'Чай' }, ro: { name: 'Ceai Negru', desc: 'Ceai negru aromat infuzat în ceainic', tag: 'Ceai' }, en: { name: 'Black Tea', desc: 'Aromatic loose leaf black tea in a pot', tag: 'Tea' } },
    { id: 'dr11', category: 'bar', price: 55, ru: { name: 'Зелёный чай', desc: 'Освежающий зелёный чай в чайнике', tag: 'Чай' }, ro: { name: 'Ceai Verde', desc: 'Ceai verde răcoritor infuzat în ceainic', tag: 'Ceai' }, en: { name: 'Green Tea', desc: 'Refreshing green tea in a pot', tag: 'Tea' } },
    { id: 'dr12', category: 'bar', price: 60, ru: { name: 'Ташкентский чай', desc: 'Фирменный узбекский чай с лимоном, мятой и специями', tag: 'Фирменный Чай' }, ro: { name: 'Ceai Tașkent', desc: 'Ceai uzbec special cu lămâie, mentă și mirodenii', tag: 'Special' }, en: { name: 'Signature Tashkent Tea', desc: 'Authentic Uzbek tea with lemon, fresh mint, and spices', tag: 'Signature' } },

    // СОКИ
    { id: 'dr13', category: 'bar', price: 40, ru: { name: 'Сок Апельсиновый', desc: 'Натуральный апельсиновый сок', tag: 'Сок' }, ro: { name: 'Suc de Portocale', desc: 'Suc natural de portocale', tag: 'Suc' }, en: { name: 'Orange Juice', desc: 'Natural orange juice', tag: 'Juice' } },
    { id: 'dr14', category: 'bar', price: 40, ru: { name: 'Сок Апельсин–Манго', desc: 'Сочный микс апельсина и манго', tag: 'Сок' }, ro: { name: 'Suc de Portocale și Mango', desc: 'Amestec suculent de portocale și mango', tag: 'Suc' }, en: { name: 'Orange–Mango Juice', desc: 'Delicious blend of orange and mango', tag: 'Juice' } },
    { id: 'dr15', category: 'bar', price: 40, ru: { name: 'Сок Яблочный', desc: 'Натуральный яблочный сок', tag: 'Сок' }, ro: { name: 'Suc de Mere', desc: 'Suc natural de mere', tag: 'Suc' }, en: { name: 'Apple Juice', desc: 'Natural apple juice', tag: 'Juice' } },
    { id: 'dr16', category: 'bar', price: 40, ru: { name: 'Сок Яблоко–Виноград', desc: 'Освежающий сок яблоко-виноград', tag: 'Сок' }, ro: { name: 'Suc de Mere și Struguri', desc: 'Suc de mere și struguri', tag: 'Suc' }, en: { name: 'Apple–Grape Juice', desc: 'Apple and grape juice mix', tag: 'Juice' } },
    { id: 'dr17', category: 'bar', price: 40, ru: { name: 'Сок Томатный', desc: 'Насыщенный томатный сок', tag: 'Сок' }, ro: { name: 'Suc de Roșii', desc: 'Suc natural de roșii', tag: 'Suc' }, en: { name: 'Tomato Juice', desc: 'Rich tomato juice', tag: 'Juice' } },
    { id: 'dr18', category: 'bar', price: 40, ru: { name: 'Сок Мультивитамин', desc: 'Витаминный микс фруктовых соков', tag: 'Сок' }, ro: { name: 'Suc Multivitamin', desc: 'Suc multivitaminic', tag: 'Suc' }, en: { name: 'Multivitamin Juice', desc: 'Multivitamin juice blend', tag: 'Juice' } },

    // ГАЗИРОВАННЫЕ НАПИТКИ
    { id: 'dr19', category: 'bar', price: 45, ru: { name: 'Coca-Cola (0.33 л)', desc: 'Прохладительный напиток Coca-Cola', tag: 'Газировка' }, ro: { name: 'Coca-Cola (0.33L)', desc: 'Băutură răcoritoare carbogazoasă', tag: 'Soda' }, en: { name: 'Coca-Cola (0.33L)', desc: 'Chilled soft soda drink', tag: 'Soda' } },
    { id: 'dr20', category: 'bar', price: 45, ru: { name: 'Coca-Cola Zero (0.33 л)', desc: 'Без сахара', tag: 'Газировка' }, ro: { name: 'Coca-Cola Zero (0.33L)', desc: 'Fără zahăr', tag: 'Soda' }, en: { name: 'Coca-Cola Zero (0.33L)', desc: 'Sugar-free Coca-Cola', tag: 'Soda' } },
    { id: 'dr21', category: 'bar', price: 45, ru: { name: 'Fanta (0.33 л)', desc: 'Апельсиновая газировка', tag: 'Газировка' }, ro: { name: 'Fanta (0.33L)', desc: 'Băutură răcoritoare de portocale', tag: 'Soda' }, en: { name: 'Fanta (0.33L)', desc: 'Orange flavored soda', tag: 'Soda' } },
    { id: 'dr22', category: 'bar', price: 45, ru: { name: 'Sprite (0.33 л)', desc: 'Лимонно-лаймовая газировка', tag: 'Газировка' }, ro: { name: 'Sprite (0.33L)', desc: 'Băutură răcoritoare cu lămâie', tag: 'Soda' }, en: { name: 'Sprite (0.33L)', desc: 'Lemon-lime soft soda', tag: 'Soda' } },
    { id: 'dr23', category: 'bar', price: 45, ru: { name: 'Tonic', desc: 'Классический тоник', tag: 'Газировка' }, ro: { name: 'Tonic', desc: 'Apă tonică clasică', tag: 'Soda' }, en: { name: 'Tonic Water', desc: 'Classic tonic water', tag: 'Soda' } },
    { id: 'dr24', category: 'bar', price: 50, ru: { name: 'Pink Tonic', desc: 'Розовый премиальный тоник', tag: 'Газировка' }, ro: { name: 'Pink Tonic', desc: 'Apă tonică roz premium', tag: 'Soda' }, en: { name: 'Pink Tonic', desc: 'Premium pink tonic water', tag: 'Soda' } },
    { id: 'dr25', category: 'bar', price: 50, ru: { name: 'Bitter Tonic', desc: 'Горьковатый тоник', tag: 'Газировка' }, ro: { name: 'Bitter Tonic', desc: 'Apă tonică amăruie', tag: 'Soda' }, en: { name: 'Bitter Tonic', desc: 'Bitter tonic water', tag: 'Soda' } },
    { id: 'dr26', category: 'bar', price: 50, ru: { name: 'Mojito Tonic', desc: 'Тоник со вкусом Мохито', tag: 'Газировка' }, ro: { name: 'Mojito Tonic', desc: 'Apă tonică cu aromă de Mojito', tag: 'Soda' }, en: { name: 'Mojito Tonic', desc: 'Mojito flavored tonic water', tag: 'Soda' } },

    // ВОДА
    { id: 'dr27', category: 'bar', price: 35, ru: { name: 'Aquapanna 0.25 л', desc: 'Итальянская премиальная минеральная вода без газа', tag: 'Вода' }, ro: { name: 'Aquapanna 0.25L', desc: 'Apă minerală plată premium', tag: 'Apă' }, en: { name: 'Aquapanna 0.25L', desc: 'Premium still mineral water', tag: 'Water' } },
    { id: 'dr28', category: 'bar', price: 70, ru: { name: 'Aquapanna 0.75 л', desc: 'Итальянская премиальная минеральная вода без газа (0.75 л)', tag: 'Вода' }, ro: { name: 'Aquapanna 0.75L', desc: 'Apă minerală plată premium (0.75L)', tag: 'Apă' }, en: { name: 'Aquapanna 0.75L', desc: 'Premium still mineral water (0.75L)', tag: 'Water' } },
    { id: 'dr29', category: 'bar', price: 35, ru: { name: 'Sanpellegrino 0.25 л', desc: 'Итальянская минеральная газированная вода', tag: 'Вода' }, ro: { name: 'Sanpellegrino 0.25L', desc: 'Apă minerală carbogazoasă premium', tag: 'Apă' }, en: { name: 'Sanpellegrino 0.25L', desc: 'Premium sparkling mineral water', tag: 'Water' } },
    { id: 'dr30', category: 'bar', price: 70, ru: { name: 'Sanpellegrino 0.75 л', desc: 'Итальянская минеральная газированная вода (0.75 л)', tag: 'Вода' }, ro: { name: 'Sanpellegrino 0.75L', desc: 'Apă minerală carbogazoasă premium (0.75L)', tag: 'Apă' }, en: { name: 'Sanpellegrino 0.75L', desc: 'Premium sparkling mineral water (0.75L)', tag: 'Water' } },
    { id: 'dr31', category: 'bar', price: 35, ru: { name: 'Jana 0.33 л', desc: 'Артезианская природная вода', tag: 'Вода' }, ro: { name: 'Jana 0.33L', desc: 'Apă minerală plată naturală', tag: 'Apă' }, en: { name: 'Jana 0.33L', desc: 'Natural artesian still water', tag: 'Water' } },
    { id: 'dr32', category: 'bar', price: 55, ru: { name: 'Jana 0.75 л', desc: 'Артезианская природная вода (0.75 л)', tag: 'Вода' }, ro: { name: 'Jana 0.75L', desc: 'Apă minerală plată naturală (0.75L)', tag: 'Apă' }, en: { name: 'Jana 0.75L', desc: 'Natural artesian still water (0.75L)', tag: 'Water' } },
    { id: 'dr33', category: 'bar', price: 40, ru: { name: 'Jamnica 0.25 л', desc: 'Минеральная газированная вода', tag: 'Вода' }, ro: { name: 'Jamnica 0.25L', desc: 'Apă minerală carbogazoasă', tag: 'Apă' }, en: { name: 'Jamnica 0.25L', desc: 'Sparkling mineral water', tag: 'Water' } },
    { id: 'dr34', category: 'bar', price: 75, ru: { name: 'Jamnica 0.75 л', desc: 'Минеральная газированная вода (0.75 л)', tag: 'Вода' }, ro: { name: 'Jamnica 0.75L', desc: 'Apă minerală carbogazoasă (0.75L)', tag: 'Apă' }, en: { name: 'Jamnica 0.75L', desc: 'Sparkling mineral water (0.75L)', tag: 'Water' } },
    { id: 'dr35', category: 'bar', price: 35, ru: { name: 'Dorna 0.25 л', desc: 'Минеральная вода', tag: 'Вода' }, ro: { name: 'Dorna 0.25L', desc: 'Apă minerală plată / carbogazoasă', tag: 'Apă' }, en: { name: 'Dorna 0.25L', desc: 'Mineral water bottle', tag: 'Water' } },

    // ЛИМОНАДЫ
    { id: 'dr36', category: 'bar', price: 85, ru: { name: 'Классический лимонад', desc: 'Свежевыжатый лимонный лимонад с мятой', tag: 'Лимонад' }, ro: { name: 'Limonadă Clasică', desc: 'Limonadă proaspătă cu lămâie și mentă', tag: 'Limonadă' }, en: { name: 'Classic Lemonade', desc: 'Freshly squeezed lemon lemonade with mint', tag: 'Lemonade' } },
    { id: 'dr37', category: 'bar', price: 90, ru: { name: 'Мохито-лимонад', desc: 'Освежающий лимонад со вкусом Мохито и мятой', tag: 'Лимонад' }, ro: { name: 'Limonadă Mojito', desc: 'Limonadă răcoritoare cu aromă de Mojito și mentă', tag: 'Limonadă' }, en: { name: 'Mojito Lemonade', desc: 'Refreshing Mojito styled minty lemonade', tag: 'Lemonade' } },
    { id: 'dr38', category: 'bar', price: 90, ru: { name: 'Цитрусовый лимонад', desc: 'Микс апельсина, грейпфрута и лимона', tag: 'Лимонад' }, ro: { name: 'Limonadă de Citrice', desc: 'Mix de portocale, grefon și lămâie', tag: 'Limonadă' }, en: { name: 'Citrus Lemonade', desc: 'Citrus blend of orange, grapefruit, and lemon', tag: 'Lemonade' } },
    { id: 'dr39', category: 'bar', price: 90, ru: { name: 'Красный лимонад', desc: 'Ягодный сочный лимонад', tag: 'Лимонад' }, ro: { name: 'Limonadă Roșie', desc: 'Limonadă suculentă cu fructe de pădure', tag: 'Limonadă' }, en: { name: 'Red Lemonade', desc: 'Red berry infused juicy lemonade', tag: 'Lemonade' } },

    // КОМПОТ
    { id: 'dr40', category: 'bar', price: 600, image: 'images/compot_30l.jpg', ru: { name: 'Домашний компот (30 л)', desc: 'Натуральный узбекский домашний компот из сухофруктов и ягод (30 литров)', tag: 'Компот' }, ro: { name: 'Compot de casă (30L)', desc: 'Compot tradițional uzbec din fructe uscate și fructe de pădure (30 litri)', tag: 'Compot' }, en: { name: 'Homemade Compote (30L)', desc: 'Traditional Uzbek fruit compote made with dried fruits & berries (30L)', tag: 'Compote' } },

    // 10. АЛКОГОЛЬНЫЕ НАПИТКИ (alcohol)
    // КОКТЕЙЛИ (Cocktails)
    { id: 'ck1', category: 'alcohol', price: 120, ru: { name: 'Aperol Spritz', desc: 'Освежающий итальянский коктейль со просекко и аперолем', tag: 'Коктейль' }, ro: { name: 'Aperol Spritz', desc: 'Cocktail clasic italian răcoritor cu prosecco și aperol', tag: 'Cocktail' }, en: { name: 'Aperol Spritz', desc: 'Classic refreshing Italian cocktail with prosecco and aperol', tag: 'Cocktail' } },
    { id: 'ck2', category: 'alcohol', price: 120, ru: { name: 'Limoncello Spritz', desc: 'Цитрусовый коктейль с лимочелло и игристым вином', tag: 'Коктейль' }, ro: { name: 'Limoncello Spritz', desc: 'Cocktail răcoritor de citrice cu limoncello și vin spumant', tag: 'Cocktail' }, en: { name: 'Limoncello Spritz', desc: 'Zesty citrus cocktail with limoncello liqueur and sparkling wine', tag: 'Cocktail' } },
    { id: 'ck3', category: 'alcohol', price: 150, ru: { name: 'Mai Tai', desc: 'Тропический коктейль на основе выдержанного и светлого рома', tag: 'Коктейль' }, ro: { name: 'Mai Tai', desc: 'Cocktail tropical pe bază de rom maturat și rom alb', tag: 'Cocktail' }, en: { name: 'Mai Tai', desc: 'Classic tropical rum cocktail with citrus and almond syrup', tag: 'Cocktail' } },
    { id: 'ck4', category: 'alcohol', price: 150, ru: { name: 'Negroni', desc: 'Классический коктейль из джина, кампари и красного вермута', tag: 'Коктейль' }, ro: { name: 'Negroni', desc: 'Cocktail clasic italian din gin, campari și vermut roșu', tag: 'Cocktail' }, en: { name: 'Negroni', desc: 'Iconic Italian cocktail with gin, Campari, and sweet red vermouth', tag: 'Cocktail' } },
    { id: 'ck5', category: 'alcohol', price: 130, ru: { name: 'Ginger Dark', desc: 'Пряный коктейль с тёмным ромом и имбирным элем', tag: 'Коктейль' }, ro: { name: 'Ginger Dark', desc: 'Cocktail condimentat cu rom negru și ginger ale', tag: 'Cocktail' }, en: { name: 'Ginger Dark', desc: 'Spiced dark rum cocktail topped with refreshing ginger ale', tag: 'Cocktail' } },
    { id: 'ck6', category: 'alcohol', price: 100, ru: { name: 'Hugo', desc: 'Лёгкий коктейль с сиропом бузины, мятой и просекко', tag: 'Коктейль' }, ro: { name: 'Hugo', desc: 'Cocktail lejer cu sirop de soc, mentă și prosecco', tag: 'Cocktail' }, en: { name: 'Hugo', desc: 'Light refreshing aperitif with elderflower, fresh mint, and prosecco', tag: 'Cocktail' } },
    { id: 'ck7', category: 'alcohol', price: 100, ru: { name: 'Gin Tonic', desc: 'Классический освежающий микс джина и тоника с лаймом', tag: 'Коктейль' }, ro: { name: 'Gin Tonic', desc: 'Mix clasic răcoritor de gin și apă tonică cu lime', tag: 'Cocktail' }, en: { name: 'Gin & Tonic', desc: 'Classic refreshing blend of premium gin and tonic water with lime', tag: 'Cocktail' } },

    // КРЕПКИЕ АЛКОГОЛЬНЫЕ НАПИТКИ (Все цены за 50 мл)
    { id: 'al1', category: 'alcohol', price: 70, ru: { name: 'Водка Finlandia (50 мл)', desc: 'Финская водка премиум-класса • Цена за 50 мл', tag: 'Водка (50 мл)' }, ro: { name: 'Votcă Finlandia (50 ml)', desc: 'Votcă finlandeză premium • Preț pentru 50 ml', tag: 'Vodcă (50 ml)' }, en: { name: 'Finlandia Vodka (50 ml)', desc: 'Premium Finnish vodka • Price per 50 ml shot', tag: 'Vodka (50 ml)' } },
    { id: 'al2', category: 'alcohol', price: 90, ru: { name: 'Текила Jose Cuervo (50 мл)', desc: 'Мексиканская текила • Цена за 50 мл', tag: 'Текила (50 мл)' }, ro: { name: 'Tequila Jose Cuervo (50 ml)', desc: 'Tequila mexicană • Preț pentru 50 ml', tag: 'Tequila (50 ml)' }, en: { name: 'Jose Cuervo Tequila (50 ml)', desc: 'Mexican Jose Cuervo tequila • Price per 50 ml shot', tag: 'Tequila (50 ml)' } },

    // РАКИЯ
    { id: 'al3', category: 'alcohol', price: 70, ru: { name: 'Ракия Сливовая (50 мл)', desc: 'Фруктовый дистиллят из слив • Цена за 50 мл', tag: 'Ракия (50 мл)' }, ro: { name: 'Rachiu de Prune (50 ml)', desc: 'Distilat natural de prune • Preț pentru 50 ml', tag: 'Rachiu (50 ml)' }, en: { name: 'Plum Rakia (50 ml)', desc: 'Natural plum fruit spirit • Price per 50 ml shot', tag: 'Rakia (50 ml)' } },
    { id: 'al4', category: 'alcohol', price: 70, ru: { name: 'Ракия Виноградная (50 мл)', desc: 'Виноградный фруктовый дистиллят • Цена за 50 мл', tag: 'Ракия (50 мл)' }, ro: { name: 'Rachiu de Struguri (50 ml)', desc: 'Distilat de struguri • Preț pentru 50 ml', tag: 'Rachiu (50 ml)' }, en: { name: 'Grape Rakia (50 ml)', desc: 'Natural grape spirit • Price per 50 ml shot', tag: 'Rakia (50 ml)' } },
    { id: 'al5', category: 'alcohol', price: 70, ru: { name: 'Ракия Абрикосовая (50 мл)', desc: 'Ароматный дистиллят из абрикосов • Цена за 50 мл', tag: 'Ракия (50 мл)' }, ro: { name: 'Rachiu de Caise (50 ml)', desc: 'Distilat natural de caise • Preț pentru 50 ml', tag: 'Rachiu (50 ml)' }, en: { name: 'Apricot Rakia (50 ml)', desc: 'Natural apricot fruit spirit • Price per 50 ml shot', tag: 'Rakia (50 ml)' } },

    // ДЖИН, ВИСКИ, РОМ, КОНЬЯК
    { id: 'al6', category: 'alcohol', price: 90, ru: { name: 'Джин Bombay (50 мл)', desc: 'Премиальный сухой джин • Цена за 50 мл', tag: 'Джин (50 мл)' }, ro: { name: 'Gin Bombay (50 ml)', desc: 'Gin sec premium • Preț pentru 50 ml', tag: 'Gin (50 ml)' }, en: { name: 'Bombay Gin (50 ml)', desc: 'Premium dry gin • Price per 50 ml shot', tag: 'Gin (50 ml)' } },
    { id: 'al7', category: 'alcohol', price: 100, ru: { name: 'Виски Monkey Shoulder (50 мл)', desc: 'Шотландский солодовый виски • Цена за 50 мл', tag: 'Виски (50 мл)' }, ro: { name: 'Whisky Monkey Shoulder (50 ml)', desc: 'Whisky de malț scoțian • Preț pentru 50 ml', tag: 'Whisky (50 ml)' }, en: { name: 'Monkey Shoulder Whiskey (50 ml)', desc: 'Blended malt Scotch whisky • Price per 50 ml shot', tag: 'Whiskey (50 ml)' } },

    { id: 'al8', category: 'alcohol', price: 75, ru: { name: 'Ром Black Tears Dark (50 мл)', desc: 'Пряный тёмный кубинский ром • Цена за 50 мл', tag: 'Ром (50 мл)' }, ro: { name: 'Rom Black Tears Dark (50 ml)', desc: 'Rom negru condimentat • Preț pentru 50 ml', tag: 'Rom (50 ml)' }, en: { name: 'Black Tears Dark Rum (50 ml)', desc: 'Spiced dark Cuban rum • Price per 50 ml shot', tag: 'Rum (50 ml)' } },
    { id: 'al9', category: 'alcohol', price: 75, ru: { name: 'Ром Black Tears Gold (50 мл)', desc: 'Выдержанный золотой ром • Цена за 50 мл', tag: 'Ром (50 мл)' }, ro: { name: 'Rom Black Tears Gold (50 ml)', desc: 'Rom auriu maturat • Preț pentru 50 ml', tag: 'Rom (50 ml)' }, en: { name: 'Black Tears Gold Rum (50 ml)', desc: 'Aged golden Cuban rum • Price per 50 ml shot', tag: 'Rum (50 ml)' } },
    { id: 'al10', category: 'alcohol', price: 75, ru: { name: 'Ром Black Tears White (50 мл)', desc: 'Светлый кубинский ром • Цена за 50 мл', tag: 'Ром (50 мл)' }, ro: { name: 'Rom Black Tears White (50 ml)', desc: 'Rom alb fin • Preț pentru 50 ml', tag: 'Rom (50 ml)' }, en: { name: 'Black Tears White Rum (50 ml)', desc: 'White Cuban rum • Price per 50 ml shot', tag: 'Rum (50 ml)' } },

    { id: 'al11', category: 'alcohol', price: 150, ru: { name: 'Коньяк Vartely XO (50 мл)', desc: 'Выдержанный дивин XO • Цена за 50 мл', tag: 'Коньяк (50 мл)' }, ro: { name: 'Divin Vartely XO (50 ml)', desc: 'Divin maturat XO • Preț pentru 50 ml', tag: 'Divin (50 ml)' }, en: { name: 'Cognac Vartely XO (50 ml)', desc: 'Aged Vartely XO Cognac • Price per 50 ml shot', tag: 'Cognac (50 ml)' } },
    { id: 'al12', category: 'alcohol', price: 100, ru: { name: 'Коньяк Bardar 5 (50 мл)', desc: 'Выдержка 5 лет • Цена за 50 мл', tag: 'Коньяк (50 мл)' }, ro: { name: 'Divin Bardar 5 (50 ml)', desc: 'Divin maturat 5 ani • Preț pentru 50 ml', tag: 'Divin (50 ml)' }, en: { name: 'Cognac Bardar 5 (50 ml)', desc: '5 Years Aged Cognac • Price per 50 ml shot', tag: 'Cognac (50 ml)' } },
    { id: 'al13', category: 'alcohol', price: 120, ru: { name: 'Коньяк Bardar 10 (50 мл)', desc: 'Выдержка 10 лет • Цена за 50 мл', tag: 'Коньяк (50 мл)' }, ro: { name: 'Divin Bardar 10 (50 ml)', desc: 'Divin maturat 10 ani • Preț pentru 50 ml', tag: 'Divin (50 ml)' }, en: { name: 'Cognac Bardar 10 (50 ml)', desc: '10 Years Aged Cognac • Price per 50 ml shot', tag: 'Cognac (50 ml)' } },

    // ВИННАЯ КАРТА (150 мл и 750 мл)
    // БЕЛЫЕ ВИНА
    { id: 'w1_g', category: 'alcohol', price: 75, ru: { name: 'Vartely Chardonnay — 1 бокал (150 мл)', desc: 'Белое сухое вино • 150 мл (75 лей)', tag: 'Белое вино (150мл)' }, ro: { name: 'Vartely Chardonnay — 1 pahar (150 ml)', desc: 'Vin alb sec • 150 ml (75 lei)', tag: 'Vin alb (150ml)' }, en: { name: 'Vartely Chardonnay — 1 Glass (150 ml)', desc: 'Dry white wine • 150 ml glass (75 lei)', tag: 'White Wine (150ml)' } },
    { id: 'w1_b', category: 'alcohol', price: 350, ru: { name: 'Vartely Chardonnay — Бутылка (750 мл)', desc: 'Белое сухое вино • Бутылка 750 мл (350 лей)', tag: 'Белое вино (750мл)' }, ro: { name: 'Vartely Chardonnay — Sticlă (750 ml)', desc: 'Vin alb sec • Sticlă 750 ml (350 lei)', tag: 'Vin alb (750ml)' }, en: { name: 'Vartely Chardonnay — Bottle (750 ml)', desc: 'Dry white wine • 750 ml bottle (350 lei)', tag: 'White Wine (750ml)' } },

    { id: 'w2_g', category: 'alcohol', price: 75, ru: { name: 'Vartely Riesling — 1 бокал (150 мл)', desc: 'Белое сухое вино • 150 мл (75 лей)', tag: 'Белое вино (150мл)' }, ro: { name: 'Vartely Riesling — 1 pahar (150 ml)', desc: 'Vin alb sec • 150 ml (75 lei)', tag: 'Vin alb (150ml)' }, en: { name: 'Vartely Riesling — 1 Glass (150 ml)', desc: 'Dry white wine • 150 ml glass (75 lei)', tag: 'White Wine (150ml)' } },
    { id: 'w2_b', category: 'alcohol', price: 350, ru: { name: 'Vartely Riesling — Бутылка (750 мл)', desc: 'Белое сухое вино • Бутылка 750 мл (350 лей)', tag: 'Белое вино (750мл)' }, ro: { name: 'Vartely Riesling — Sticlă (750 ml)', desc: 'Vin alb sec • Sticlă 750 ml (350 lei)', tag: 'Vin alb (750ml)' }, en: { name: 'Vartely Riesling — Bottle (750 ml)', desc: 'Dry white wine • 750 ml bottle (350 lei)', tag: 'White Wine (750ml)' } },

    { id: 'w3_g', category: 'alcohol', price: 90, ru: { name: 'Ice Wine Riesling — 1 бокал (150 мл)', desc: 'Десертное ледяное вино • 150 мл (90 лей)', tag: 'Белое вино (150мл)' }, ro: { name: 'Ice Wine Riesling — 1 pahar (150 ml)', desc: 'Vin dulce de desert • 150 ml (90 lei)', tag: 'Vin alb (150ml)' }, en: { name: 'Ice Wine Riesling — 1 Glass (150 ml)', desc: 'Dessert ice wine • 150 ml glass (90 lei)', tag: 'White Wine (150ml)' } },
    { id: 'w3_b', category: 'alcohol', price: 450, ru: { name: 'Ice Wine Riesling — Бутылка (750 мл)', desc: 'Десертное ледяное вино • Бутылка 750 мл (450 лей)', tag: 'Белое вино (750мл)' }, ro: { name: 'Ice Wine Riesling — Sticlă (750 ml)', desc: 'Vin dulce de desert • Sticlă 750 ml (450 lei)', tag: 'Vin alb (750ml)' }, en: { name: 'Ice Wine Riesling — Bottle (750 ml)', desc: 'Dessert ice wine • 750 ml bottle (450 lei)', tag: 'White Wine (750ml)' } },

    { id: 'w4_g', category: 'alcohol', price: 75, ru: { name: 'Vartely Viorica — 1 бокал (150 мл)', desc: 'Белое сухое вино • 150 мл (75 лей)', tag: 'Белое вино (150мл)' }, ro: { name: 'Vartely Viorica — 1 pahar (150 ml)', desc: 'Vin alb sec • 150 ml (75 lei)', tag: 'Vin alb (150ml)' }, en: { name: 'Vartely Viorica — 1 Glass (150 ml)', desc: 'Dry white Viorica • 150 ml glass (75 lei)', tag: 'White Wine (150ml)' } },
    { id: 'w4_b', category: 'alcohol', price: 350, ru: { name: 'Vartely Viorica — Бутылка (750 мл)', desc: 'Белое сухое вино • Бутылка 750 мл (350 лей)', tag: 'Белое вино (750мл)' }, ro: { name: 'Vartely Viorica — Sticlă (750 ml)', desc: 'Vin alb sec • Sticlă 750 ml (350 lei)', tag: 'Vin alb (750ml)' }, en: { name: 'Vartely Viorica — Bottle (750 ml)', desc: 'Dry white Viorica • 750 ml bottle (350 lei)', tag: 'White Wine (750ml)' } },

    { id: 'w5_g', category: 'alcohol', price: 75, ru: { name: 'Vartely Sauvignon Blanc — 1 бокал (150 мл)', desc: 'Свежее белое сухое вино • 150 мл (75 лей)', tag: 'Белое вино (150мл)' }, ro: { name: 'Vartely Sauvignon Blanc — 1 pahar (150 ml)', desc: 'Vin alb sec • 150 ml (75 lei)', tag: 'Vin alb (150ml)' }, en: { name: 'Vartely Sauvignon Blanc — 1 Glass (150 ml)', desc: 'Fresh dry white wine • 150 ml glass (75 lei)', tag: 'White Wine (150ml)' } },
    { id: 'w5_b', category: 'alcohol', price: 350, ru: { name: 'Vartely Sauvignon Blanc — Бутылка (750 мл)', desc: 'Свежее белое сухое вино • Бутылка 750 мл (350 лей)', tag: 'Белое вино (750мл)' }, ro: { name: 'Vartely Sauvignon Blanc — Sticlă (750 ml)', desc: 'Vin alb sec • Sticlă 750 ml (350 lei)', tag: 'Vin alb (750ml)' }, en: { name: 'Vartely Sauvignon Blanc — Bottle (750 ml)', desc: 'Fresh dry white wine • 750 ml bottle (350 lei)', tag: 'White Wine (750ml)' } },

    { id: 'w6_g', category: 'alcohol', price: 80, ru: { name: 'Individo Fetească Regală / Riesling — 1 бокал (150 мл)', desc: 'Купажное белое сухое вино • 150 мл (80 лей)', tag: 'Белое вино (150мл)' }, ro: { name: 'Individo Fetească Regală / Riesling — 1 pahar (150 ml)', desc: 'Vin alb sec cupaj • 150 ml (80 lei)', tag: 'Vin alb (150ml)' }, en: { name: 'Individo Fetească Regală / Riesling — 1 Glass (150 ml)', desc: 'Blended dry white wine • 150 ml glass (80 lei)', tag: 'White Wine (150ml)' } },
    { id: 'w6_b', category: 'alcohol', price: 380, ru: { name: 'Individo Fetească Regală / Riesling — Бутылка (750 мл)', desc: 'Купажное белое сухое вино • Бутылка 750 мл (380 лей)', tag: 'Белое вино (750мл)' }, ro: { name: 'Individo Fetească Regală / Riesling — Sticlă (750 ml)', desc: 'Vin alb sec cupaj • Sticlă 750 ml (380 lei)', tag: 'Vin alb (750ml)' }, en: { name: 'Individo Fetească Regală / Riesling — Bottle (750 ml)', desc: 'Blended dry white wine • 750 ml bottle (380 lei)', tag: 'White Wine (750ml)' } },

    { id: 'w7_g', category: 'alcohol', price: 80, ru: { name: 'Individo Traminer / Sauvignon Blanc — 1 бокал (150 мл)', desc: 'Ароматное белое сухое вино • 150 мл (80 лей)', tag: 'Белое вино (150мл)' }, ro: { name: 'Individo Traminer / Sauvignon Blanc — 1 pahar (150 ml)', desc: 'Vin alb sec aromat • 150 ml (80 lei)', tag: 'Vin alb (150ml)' }, en: { name: 'Individo Traminer / Sauvignon Blanc — 1 Glass (150 ml)', desc: 'Aromatic dry white wine • 150 ml glass (80 lei)', tag: 'White Wine (150ml)' } },
    { id: 'w7_b', category: 'alcohol', price: 380, ru: { name: 'Individo Traminer / Sauvignon Blanc — Бутылка (750 мл)', desc: 'Ароматное белое сухое вино • Бутылка 750 мл (380 лей)', tag: 'Белое вино (750мл)' }, ro: { name: 'Individo Traminer / Sauvignon Blanc — Sticlă (750 ml)', desc: 'Vin alb sec aromat • Sticlă 750 ml (380 lei)', tag: 'Vin alb (750ml)' }, en: { name: 'Individo Traminer / Sauvignon Blanc — Bottle (750 ml)', desc: 'Aromatic dry white wine • 750 ml bottle (380 lei)', tag: 'White Wine (750ml)' } },

    { id: 'w8_b', category: 'alcohol', price: 650, ru: { name: 'Taraboste Chardonnay — Бутылка (750 мл)', desc: 'Премиальное коллекционное белое вино • Бутылка 750 мл (650 лей)', tag: 'Премиум вино' }, ro: { name: 'Taraboste Chardonnay — Sticlă (750 ml)', desc: 'Vin alb premium de colecție • Sticlă 750 ml (650 lei)', tag: 'Vin Premium' }, en: { name: 'Taraboste Chardonnay — Bottle (750 ml)', desc: 'Premium reserve white wine • 750 ml bottle (650 lei)', tag: 'Premium Wine' } },

    // РОЗОВЫЕ ВИНА
    { id: 'w9_g', category: 'alcohol', price: 80, ru: { name: 'Individo Malbec / Syrah Rosé — 1 бокал (150 мл)', desc: 'Розовое сухое вино • 150 мл (80 лей)', tag: 'Розовое вино (150мл)' }, ro: { name: 'Individo Malbec / Syrah Rosé — 1 pahar (150 ml)', desc: 'Vin rosé sec • 150 ml (80 lei)', tag: 'Vin rosé (150ml)' }, en: { name: 'Individo Malbec / Syrah Rosé — 1 Glass (150 ml)', desc: 'Dry rosé wine • 150 ml glass (80 lei)', tag: 'Rosé Wine (150ml)' } },
    { id: 'w9_b', category: 'alcohol', price: 380, ru: { name: 'Individo Malbec / Syrah Rosé — Бутылка (750 мл)', desc: 'Розовое сухое вино • Бутылка 750 мл (380 лей)', tag: 'Розовое вино (750мл)' }, ro: { name: 'Individo Malbec / Syrah Rosé — Sticlă (750 ml)', desc: 'Vin rosé sec • Sticlă 750 ml (380 lei)', tag: 'Vin rosé (750ml)' }, en: { name: 'Individo Malbec / Syrah Rosé — Bottle (750 ml)', desc: 'Dry rosé wine • 750 ml bottle (380 lei)', tag: 'Rosé Wine (750ml)' } },

    // КРАСНЫЕ ВИНА
    { id: 'w10_g', category: 'alcohol', price: 75, ru: { name: 'Vartely Cabernet Sauvignon — 1 бокал (150 мл)', desc: 'Красное сухое вино • 150 мл (75 лей)', tag: 'Красное вино (150мл)' }, ro: { name: 'Vartely Cabernet Sauvignon — 1 pahar (150 ml)', desc: 'Vin roșu sec • 150 ml (75 lei)', tag: 'Vin roșu (150ml)' }, en: { name: 'Vartely Cabernet Sauvignon — 1 Glass (150 ml)', desc: 'Dry red wine • 150 ml glass (75 lei)', tag: 'Red Wine (150ml)' } },
    { id: 'w10_b', category: 'alcohol', price: 350, ru: { name: 'Vartely Cabernet Sauvignon — Бутылка (750 мл)', desc: 'Красное сухое вино • Бутылка 750 мл (350 лей)', tag: 'Красное вино (750мл)' }, ro: { name: 'Vartely Cabernet Sauvignon — Sticlă (750 ml)', desc: 'Vin roșu sec • Sticlă 750 ml (350 lei)', tag: 'Vin roșu (750ml)' }, en: { name: 'Vartely Cabernet Sauvignon — Bottle (750 ml)', desc: 'Dry red wine • 750 ml bottle (350 lei)', tag: 'Red Wine (750ml)' } },

    { id: 'w11_g', category: 'alcohol', price: 80, ru: { name: 'Vartely Pinot Noir — 1 бокал (150 мл)', desc: 'Красное сухое вино • 150 мл (80 лей)', tag: 'Красное вино (150мл)' }, ro: { name: 'Vartely Pinot Noir — 1 pahar (150 ml)', desc: 'Vin roșu sec • 150 ml (80 lei)', tag: 'Vin roșu (150ml)' }, en: { name: 'Vartely Pinot Noir — 1 Glass (150 ml)', desc: 'Dry red wine • 150 ml glass (80 lei)', tag: 'Red Wine (150ml)' } },
    { id: 'w11_b', category: 'alcohol', price: 380, ru: { name: 'Vartely Pinot Noir — Бутылка (750 мл)', desc: 'Красное сухое вино • Бутылка 750 мл (380 лей)', tag: 'Красное вино (750мл)' }, ro: { name: 'Vartely Pinot Noir — Sticlă (750 ml)', desc: 'Vin roșu sec • Sticlă 750 ml (380 lei)', tag: 'Vin roșu (750ml)' }, en: { name: 'Vartely Pinot Noir — Bottle (750 ml)', desc: 'Dry red wine • 750 ml bottle (380 lei)', tag: 'Red Wine (750ml)' } },

    { id: 'w12_g', category: 'alcohol', price: 80, ru: { name: 'Vartely Saperavi — 1 бокал (150 мл)', desc: 'Насыщенное красное вино Саперави • 150 мл (80 лей)', tag: 'Красное вино (150мл)' }, ro: { name: 'Vartely Saperavi — 1 pahar (150 ml)', desc: 'Vin roșu sec Saperavi • 150 ml (80 lei)', tag: 'Vin roșu (150ml)' }, en: { name: 'Vartely Saperavi — 1 Glass (150 ml)', desc: 'Full-bodied dry red Saperavi • 150 ml glass (80 lei)', tag: 'Red Wine (150ml)' } },
    { id: 'w12_b', category: 'alcohol', price: 380, ru: { name: 'Vartely Saperavi — Бутылка (750 мл)', desc: 'Насыщенное красное вино Саперави • Бутылка 750 мл (380 лей)', tag: 'Красное вино (750мл)' }, ro: { name: 'Vartely Saperavi — Sticlă (750 ml)', desc: 'Vin roșu sec Saperavi • Sticlă 750 ml (380 lei)', tag: 'Vin roșu (750ml)' }, en: { name: 'Vartely Saperavi — Bottle (750 ml)', desc: 'Full-bodied dry red Saperavi • 750 ml bottle (380 lei)', tag: 'Red Wine (750ml)' } },

    { id: 'w13_g', category: 'alcohol', price: 80, ru: { name: 'Individo Fetească Neagră — 1 бокал (150 мл)', desc: 'Красное сухое автохтонное вино • 150 мл (80 лей)', tag: 'Красное вино (150мл)' }, ro: { name: 'Individo Fetească Neagră — 1 pahar (150 ml)', desc: 'Vin roșu sec din soi autohton • 150 ml (80 lei)', tag: 'Vin roșu (150ml)' }, en: { name: 'Individo Fetească Neagră — 1 Glass (150 ml)', desc: 'Indigenous dry red wine • 150 ml glass (80 lei)', tag: 'Red Wine (150ml)' } },
    { id: 'w13_b', category: 'alcohol', price: 380, ru: { name: 'Individo Fetească Neagră — Бутылка (750 мл)', desc: 'Красное сухое автохтонное вино • Бутылка 750 мл (380 лей)', tag: 'Красное вино (750мл)' }, ro: { name: 'Individo Fetească Neagră — Sticlă (750 ml)', desc: 'Vin roșu sec din soi autohton • Sticlă 750 ml (380 lei)', tag: 'Vin roșu (750ml)' }, en: { name: 'Individo Fetească Neagră — Bottle (750 ml)', desc: 'Indigenous dry red wine • 750 ml bottle (380 lei)', tag: 'Red Wine (750ml)' } },

    { id: 'w14_g', category: 'alcohol', price: 80, ru: { name: 'Individo Malbec / Syrah — 1 бокал (150 мл)', desc: 'Купажное красное сухое вино • 150 мл (80 лей)', tag: 'Красное вино (150мл)' }, ro: { name: 'Individo Malbec / Syrah — 1 pahar (150 ml)', desc: 'Vin roșu sec cupaj • 150 ml (80 lei)', tag: 'Vin roșu (150ml)' }, en: { name: 'Individo Malbec / Syrah — 1 Glass (150 ml)', desc: 'Blended dry red wine • 150 ml glass (80 lei)', tag: 'Red Wine (150ml)' } },
    { id: 'w14_b', category: 'alcohol', price: 380, ru: { name: 'Individo Malbec / Syrah — Бутылка (750 мл)', desc: 'Купажное красное сухое вино • Бутылка 750 мл (380 лей)', tag: 'Красное вино (750мл)' }, ro: { name: 'Individo Malbec / Syrah — Sticlă (750 ml)', desc: 'Vin roșu sec cupaj • Sticlă 750 ml (380 lei)', tag: 'Vin roșu (750ml)' }, en: { name: 'Individo Malbec / Syrah — Bottle (750 ml)', desc: 'Blended dry red wine • 750 ml bottle (380 lei)', tag: 'Red Wine (750ml)' } },

    { id: 'w15_g', category: 'alcohol', price: 130, ru: { name: 'Taraboste Pinot Noir — 1 бокал (150 мл)', desc: 'Премиальное коллекционное красное вино • 150 мл (130 лей)', tag: 'Премиум вино (150мл)' }, ro: { name: 'Taraboste Pinot Noir — 1 pahar (150 ml)', desc: 'Vin roșu premium de colecție • 150 ml (130 lei)', tag: 'Vin Premium (150ml)' }, en: { name: 'Taraboste Pinot Noir — 1 Glass (150 ml)', desc: 'Premium reserve red wine • 150 ml glass (130 lei)', tag: 'Premium Wine (150ml)' } },
    { id: 'w15_b', category: 'alcohol', price: 650, ru: { name: 'Taraboste Pinot Noir — Бутылка (750 мл)', desc: 'Премиальное коллекционное красное вино • Бутылка 750 мл (650 лей)', tag: 'Премиум вино (750мл)' }, ro: { name: 'Taraboste Pinot Noir — Sticlă (750 ml)', desc: 'Vin roșu premium de colecție • Sticlă 750 ml (650 lei)', tag: 'Vin Premium (750ml)' }, en: { name: 'Taraboste Pinot Noir — Bottle (750 ml)', desc: 'Premium reserve red wine • 750 ml bottle (650 lei)', tag: 'Premium Wine (750ml)' } },

    // ИГРИСТЫЕ ВИНА
    { id: 'w16_g', category: 'alcohol', price: 90, ru: { name: 'Martelletti Prosecco — 1 бокал (150 мл)', desc: 'Итальянское игристое Просекко • 150 мл (90 лей)', tag: 'Игристое (150мл)' }, ro: { name: 'Martelletti Prosecco — 1 pahar (150 ml)', desc: 'Vin spumant italian Prosecco • 150 ml (90 lei)', tag: 'Spumante (150ml)' }, en: { name: 'Martelletti Prosecco — 1 Glass (150 ml)', desc: 'Italian Prosecco sparkling wine • 150 ml glass (90 lei)', tag: 'Sparkling (150ml)' } },
    { id: 'w16_b', category: 'alcohol', price: 450, ru: { name: 'Martelletti Prosecco — Бутылка (750 мл)', desc: 'Итальянское игристое Просекко • Бутылка 750 мл (450 лей)', tag: 'Игристое (750мл)' }, ro: { name: 'Martelletti Prosecco — Sticlă (750 ml)', desc: 'Vin spumant italian Prosecco • Sticlă 750 ml (450 lei)', tag: 'Spumante (750ml)' }, en: { name: 'Martelletti Prosecco — Bottle (750 ml)', desc: 'Italian Prosecco sparkling wine • 750 ml bottle (450 lei)', tag: 'Sparkling (750ml)' } },

    { id: 'w17_g', category: 'alcohol', price: 90, ru: { name: 'Martelletti Asti — 1 бокал (150 мл)', desc: 'Итальянское сладкое игристое вино Асти • 150 мл (90 лей)', tag: 'Игристое (150мл)' }, ro: { name: 'Martelletti Asti — 1 pahar (150 ml)', desc: 'Vin spumant dulce italian Asti • 150 ml (90 lei)', tag: 'Spumante (150ml)' }, en: { name: 'Martelletti Asti — 1 Glass (150 ml)', desc: 'Italian sweet Asti sparkling wine • 150 ml glass (90 lei)', tag: 'Sparkling (150ml)' } },
    { id: 'w17_b', category: 'alcohol', price: 450, ru: { name: 'Martelletti Asti — Бутылка (750 мл)', desc: 'Итальянское сладкое игристое вино Асти • Бутылка 750 мл (450 лей)', tag: 'Игристое (750мл)' }, ro: { name: 'Martelletti Asti — Sticlă (750 ml)', desc: 'Vin spumant dulce italian Asti • Sticlă 750 ml (450 lei)', tag: 'Spumante (750ml)' }, en: { name: 'Martelletti Asti — Bottle (750 ml)', desc: 'Italian sweet Asti sparkling wine • 750 ml bottle (450 lei)', tag: 'Sparkling (750ml)' } },

    { id: 'w18_g', category: 'alcohol', price: 80, ru: { name: 'Inspiro Vartely Brut — 1 бокал (150 мл)', desc: 'Игристое вино брют • 150 мл (80 лей)', tag: 'Игристое (150мл)' }, ro: { name: 'Inspiro Vartely Brut — 1 pahar (150 ml)', desc: 'Vin spumant brut • 150 ml (80 lei)', tag: 'Spumante (150ml)' }, en: { name: 'Inspiro Vartely Brut — 1 Glass (150 ml)', desc: 'Brut sparkling wine • 150 ml glass (80 lei)', tag: 'Sparkling (150ml)' } },
    { id: 'w18_b', category: 'alcohol', price: 400, ru: { name: 'Inspiro Vartely Brut — Бутылка (750 мл)', desc: 'Игристое вино брют • Бутылка 750 мл (400 лей)', tag: 'Игристое (750мл)' }, ro: { name: 'Inspiro Vartely Brut — Sticlă (750 ml)', desc: 'Vin spumant brut • Sticlă 750 ml (400 lei)', tag: 'Spumante (750ml)' }, en: { name: 'Inspiro Vartely Brut — Bottle (750 ml)', desc: 'Brut sparkling wine • 750 ml bottle (400 lei)', tag: 'Sparkling (750ml)' } },

    // ПИВО
    { id: 'br1', category: 'alcohol', price: 50, ru: { name: 'Львівське 0.5 л', desc: 'Светлое фильтрованное пиво Львівське (0.5 л)', tag: 'Пиво' }, ro: { name: 'Lvivske 0.5L', desc: 'Bere blondă filtrată Lvivske (0.5L)', tag: 'Bere' }, en: { name: 'Lvivske Beer 0.5L', desc: 'Light pale lager Lvivske (0.5L)', tag: 'Beer' } },
    { id: 'br2', category: 'alcohol', price: 60, ru: { name: 'Carlsberg Pilsner 0.5 л', desc: 'Классическое светлое пиво Carlsberg Pilsner (0.5 л)', tag: 'Пиво' }, ro: { name: 'Carlsberg Pilsner 0.5L', desc: 'Bere blondă de calitate Carlsberg Pilsner (0.5L)', tag: 'Bere' }, en: { name: 'Carlsberg Pilsner 0.5L', desc: 'Classic premium pilsner beer (0.5L)', tag: 'Beer' } },
    { id: 'br3', category: 'alcohol', price: 60, ru: { name: 'Львівське 1715 0.5 л', desc: 'Традиционное светлое пиво Львівське 1715 (0.5 л)', tag: 'Пиво' }, ro: { name: 'Lvivske 1715 0.5L', desc: 'Bere tradițională blondă Lvivske 1715 (0.5L)', tag: 'Bere' }, en: { name: 'Lvivske 1715 Beer 0.5L', desc: 'Traditional premium pale lager Lvivske 1715 (0.5L)', tag: 'Beer' } }
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
  const checkoutBtn = document.getElementById('checkoutBtn');
  const langSwitcher = document.getElementById('langSwitcher');

  // Change Language Function
  function setLanguage(lang) {
    currentLang = lang;
    const dict = i18n[lang] || i18n.ru;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    if (menuSearchInput && dict.search_placeholder) {
      menuSearchInput.placeholder = dict.search_placeholder;
    }

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

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

    const filtered = menuData.filter(item => {
      const itemLang = item[currentLang] || item.ru;
      const matchesCategory = (currentCategory === 'all') || (item.category === currentCategory);
      const matchesSearch = itemLang.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            itemLang.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            itemLang.tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      menuGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-muted);">
          <i class="fa-solid fa-utensils" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--color-gold);"></i>
          <p>${currentLang === 'ro' ? 'Niciun rezultat găsit' : (currentLang === 'en' ? 'No items found' : 'Ничего не найдено')}</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const itemLang = item[currentLang] || item.ru;
      const card = document.createElement('div');
      card.className = 'menu-card';
      
      const imgHtml = item.image ? `
        <div class="card-image-wrapper">
          <img src="${item.image}" alt="${itemLang.name}" class="card-img" loading="lazy">
          <span class="card-tag-badge"><i class="fa-solid fa-tag"></i> ${itemLang.tag}</span>
        </div>
      ` : '';

      const inlineTagHtml = (!item.image && itemLang.tag) ? `
        <span class="inline-tag-badge"><i class="fa-solid fa-tag"></i> ${itemLang.tag}</span>
      ` : '';

      card.innerHTML = `
        ${imgHtml}
        <div class="card-body">
          ${inlineTagHtml}
          <div class="card-top">
            <h3 class="card-title">${itemLang.name}</h3>
            <span class="card-price">${item.price} ${dict.currency}</span>
          </div>
          <p class="card-desc">${itemLang.desc}</p>
        </div>
        <div class="card-footer">
          <span style="font-size: 0.8rem; color: var(--color-text-muted);">Tashkent</span>
          <button class="btn-add-item" onclick="addToCart('${item.id}')">
            <i class="fa-solid fa-plus"></i> ${dict.btn_add_to_cart}
          </button>
        </div>
      `;
      menuGrid.appendChild(card);
    });
  }

  if (categoryTabs) {
    categoryTabs.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-btn')) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-category');
        renderMenu();
      }
    });
  }

  if (menuSearchInput) {
    menuSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderMenu();
    });
  }

  window.addToCart = function(id) {
    const item = menuData.find(m => m.id === id);
    if (!item) return;

    const existing = cart.find(c => c.id === id);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ ...item, qty: 1 });
    }

    updateCartUI();
    if (cartDrawer) cartDrawer.classList.add('active');
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

        const cartRow = document.createElement('div');
        cartRow.className = 'cart-item';
        cartRow.innerHTML = `
          <div>
            <strong style="color: #fff; display: block; font-size: 0.95rem;">${itemLang.name}</strong>
            <span style="color: var(--color-gold); font-size: 0.85rem;">${item.price} ${dict.currency} × ${item.qty}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button onclick="changeCartQty(${index}, -1)" style="background: rgba(255,255,255,0.1); border: 1px solid var(--border-glass); color: #fff; width: 26px; height: 26px; border-radius: 50%; cursor: pointer;">-</button>
            <span style="color: #fff; font-size: 0.9rem;">${item.qty}</span>
            <button onclick="changeCartQty(${index}, 1)" style="background: rgba(255,255,255,0.1); border: 1px solid var(--border-glass); color: #fff; width: 26px; height: 26px; border-radius: 50%; cursor: pointer;">+</button>
          </div>
        `;
        cartItemsList.appendChild(cartRow);
      });
    }

    if (cartTotalSum) cartTotalSum.textContent = `${total} ${dict.currency}`;
    if (cartCountBadge) cartCountBadge.textContent = count;
  }

  window.changeCartQty = function(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
    updateCartUI();
  };

  if (cartOpenBtn && cartDrawer) cartOpenBtn.addEventListener('click', () => cartDrawer.classList.add('active'));
  if (cartCloseBtn && cartDrawer) cartCloseBtn.addEventListener('click', () => cartDrawer.classList.remove('active'));

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
  setLanguage('ro');
});
