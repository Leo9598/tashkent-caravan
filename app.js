// TASHKENT CARAVAN (ТАШКЕНТ КАРАВАН) - GLOBAL MULTILINGUAL & SITE LOCKING ENGINE (RU, RO, EN)

document.addEventListener('DOMContentLoaded', () => {

  let currentLang = 'ru';
  let cart = [];
  let currentCategory = 'all';
  let searchQuery = '';

  // Global Site Open/Closed State (Synced via Serverless API)
  let isSiteOpen = true;

  // Fetch Global Site Status from Server
  async function fetchGlobalSiteStatus() {
    try {
      const res = await fetch('/api/site-status');
      if (res.ok) {
        const data = await res.json();
        isSiteOpen = data.isOpen !== false;
      }
    } catch (err) {
      console.warn('Could not fetch server status, using cached state:', err);
    }
    renderSiteStatusOverlay();
  }

  // Render Closed Overlay screen when site is locked globally
  function renderSiteStatusOverlay() {
    let closedOverlay = document.getElementById('siteClosedOverlay');

    if (!isSiteOpen) {
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

      const closedTitle = currentLang === 'ro' ? 'Restaurantul este momentan Închis' : (currentLang === 'en' ? 'Restaurant is Currently Closed' : 'Ресторан Временно Закрыт');
      const closedSubtitle = currentLang === 'ro' 
        ? 'Meniul online nu este disponibil în acest moment. Vă așteptăm cu drag în timpul programului de lucru.'
        : (currentLang === 'en' ? 'Online menu is currently unavailable. We look forward to welcoming you during working hours.' : 'Онлайн-меню сейчас недоступно. Ждем вас в гости в рабочие часы ресторана.');

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
            🔓 Открыть сайт глобально (для владельца)
          </button>
        </div>
      `;

      document.getElementById('adminToggleBtn').addEventListener('click', async () => {
        const pin = prompt('Введите PIN-код владельца:');
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
        renderSiteStatusOverlay();
        alert(targetOpen 
          ? '🟢 Сайт УСПЕШНО ОТКРЫТ для всех клиентов на всех устройствах в мире!' 
          : '🔴 Сайт УСПЕШНО ЗАКРЫТ глобально! Теперь любой клиент, отсканировавший QR-код, увидит сообщение о закрытии ресторана.');
      } else {
        alert(data.message || 'Неверный PIN-код!');
      }
    } catch (err) {
      alert('Ошибка соединения с сервером');
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
      cat_first: 'Первые блюда',
      cat_salads: 'Салаты',
      cat_mains: 'Горячие блюда & Шашлыки',
      cat_bar: 'Бар & Напитки',
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
      cat_first: 'Primele Feluri',
      cat_salads: 'Salate',
      cat_mains: 'Bucate Calde & Frigărui',
      cat_bar: 'Bar & Băuturi',
      about_subtitle: 'Tradiție & Ospitalitate',
      about_title: 'Istoria Tashkent Caravan',
      about_p1: 'În cultura uzbecă, oaspetele este o binecuvântare a casei. La restaurantul „Tashkent Caravan” reînviem tradițiile culinare seculare ale Drumului Mătăsii.',
      about_p2: 'Fiecare preparat este gătit după rețete autentice, folosind condimente uzbece originale (chimen, dudițe, coriadru) și carne de cea mai înaltă calitate.',
      about_stat1: 'Condimente Naturale',
      about_stat2: 'Zilnic fără zile libere',
      quote_text: '«Plovul nu este doar mâncare, este sufletul ospitalității uzbece și o melodie cântată într-un ceaun de fontă.»',
      quote_author: '— Bucătar Șef Tashkent Caravan',
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
      cat_first: 'First Courses',
      cat_salads: 'Salads',
      cat_mains: 'Main Dishes & Kebabs',
      cat_bar: 'Bar & Drinks',
      about_subtitle: 'Tradition & Hospitality',
      about_title: 'Story of Tashkent Caravan',
      about_p1: 'In Uzbek culture, a guest is a blessing to the home. At "Tashkent Caravan", we revive centuries-old culinary traditions of the Silk Road.',
      about_p2: 'Every dish is crafted using authentic recipes, genuine Uzbek spices (cumin, barberry, coriander), and premium meats.',
      about_stat1: 'Natural Spices',
      about_stat2: 'Open Every Day',
      quote_text: '«Plov is not just food, it is the spirit of Uzbek hospitality and a song played inside a cast-iron kazan.»',
      quote_author: '— Executive Chef Tashkent Caravan',
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
    { id: 'm1', category: 'first', price: 120, ru: { name: 'Шорпа', desc: 'Традиционный наваристый бульон из баранины с крупными овощами и зеленью', tag: 'Популярное' }, ro: { name: 'Ciorbă Șorpa', desc: 'Supă tradițională din carne de berbecuț cu legume proaspete și verdeață', tag: 'Popular' }, en: { name: 'Shorpa Soup', desc: 'Traditional rich lamb broth with chunky garden vegetables and fresh herbs', tag: 'Popular' } },
    { id: 'm2', category: 'first', price: 120, ru: { name: 'Лагман', desc: 'Аутентичная тянутая вручную лапша с сочным мясом и овощами в соусе', tag: 'Хит' }, ro: { name: 'Lagman', desc: 'Taței tradiționali făcuți manual cu carne suculentă și legume în sos', tag: 'Top' }, en: { name: 'Lagman Noodle Soup', desc: 'Authentic hand-pulled noodles with savory beef & fresh vegetables in broth', tag: 'Best Seller' } },
    { id: 'm3', category: 'first', price: 120, ru: { name: 'Дюшбера', desc: 'Миниатюрные домашние пельмени в прозрачном пряном бульоне', tag: 'Классика' }, ro: { name: 'Dușbera', desc: 'Colțunași speciali în supă limpede și aromată', tag: 'Clasic' }, en: { name: 'Dushbera Dumplings', desc: 'Delicate mini beef dumplings served in clear aromatic broth', tag: 'Classic' } },
    { id: 'm4', category: 'first', price: 130, ru: { name: 'Лагман жареный', desc: 'Обжаренная ручная лапша с телятиной, болгарским перцем и специями', tag: 'Острое' }, ro: { name: 'Lagman Prăjit', desc: 'Taței prăjiți de casă cu carne de vită, ardei dulce și condimente', tag: 'Picant' }, en: { name: 'Fried Lagman', desc: 'Pan-fried hand-pulled noodles with beef tenderloin and sweet peppers', tag: 'Savory' } },
    { id: 'm5', category: 'salads', price: 85, ru: { name: 'Чабан салат', desc: 'Свежие сочные огурцы, томаты, зелень и сладкий репчатый лук', tag: 'Свежее' }, ro: { name: 'Salată Ciobănească', desc: 'Castraveți proaspeți, roșii, verdeață și ceapă dulce', tag: 'Proaspăt' }, en: { name: 'Chaban Shepherd Salad', desc: 'Crisp fresh cucumbers, vine tomatoes, red onions, and garden herbs', tag: 'Fresh' } },
    { id: 'm6', category: 'salads', price: 85, ru: { name: 'Салат по-гречески', desc: 'Свежие овощи, сыр фета, маслины и оливковое масло', tag: 'Классика' }, ro: { name: 'Salată Grecească', desc: 'Legume proaspete, brânză feta, măsline și ulei de măsline', tag: 'Clasic' }, en: { name: 'Greek Salad', desc: 'Crisp vegetables, Greek feta cheese, olives, and extra virgin olive oil', tag: 'Classic' } },
    { id: 'm7', category: 'salads', price: 85, ru: { name: 'Цезарь с курицей', desc: 'Хрустящий салат романо, запеченная грудка, пармезан и соус цезарь', tag: 'Европа' }, ro: { name: 'Salată Caesar cu Pui', desc: 'Frunze de romano, piept de pui grilat, parmezan și sos caesar', tag: 'Delicios' }, en: { name: 'Chicken Caesar Salad', desc: 'Crisp romaine lettuce, grilled chicken breast, parmesan, and Caesar dressing', tag: 'Favorite' } },
    { id: 'm8', category: 'salads', price: 60, ru: { name: 'Ачичук', desc: 'Тончайше нарезанные томаты с луком — традиционное дополнение к плову', tag: 'К Плову' }, ro: { name: 'Salată Achichuk', desc: 'Roșii tăiate foarte fin cu ceapă — acompaniamentul perfect pentru plov', tag: 'Pentru Plov' }, en: { name: 'Achichuk Tomato Salad', desc: 'Paper-thin sliced tomatoes and red onions, traditional pairing for Plov', tag: 'Plov Pairing' } },
    { id: 'm9', category: 'mains', price: 150, ru: { name: 'Жаркое из баранины', desc: 'Сочная баранина, томленная с картофелем, луком и перцем', tag: 'Сытное' }, ro: { name: 'Friptură de Berbecuț', desc: 'Carne fragedă de berbecuț înăbușită cu cartofi și legume', tag: 'Gustoase' }, en: { name: 'Lamb Roast with Veggies', desc: 'Tender lamb slow-cooked with spiced potatoes, onions, and bell peppers', tag: 'Hearty' } },
    { id: 'm10', category: 'mains', price: 150, ru: { name: 'Жаркое из телятины', desc: 'Нежнейшая вырезка телятины с запеченными сезонными овощами', tag: 'Рекомендуем' }, ro: { name: 'Friptură de Vită', desc: 'Carne fragedă de mânzat coaptă cu legume de sezon', tag: 'Recomandat' }, en: { name: 'Veal Roast with Veggies', desc: 'Succulent veal strips roasted with roasted garlic and vegetables', tag: 'Recommended' } },
    { id: 'm11', category: 'mains', price: 120, ru: { name: 'Плов Ташкентский', desc: 'Король восточного стола: рис девзира, баранина, жёлтая морковь и зира', tag: 'Главный Хит' }, ro: { name: 'Plov Tașkent', desc: 'Regele bucătăriei uzbece: orez special, berbecuț, morcov galben și chimen', tag: 'Specialitatea Casei' }, en: { name: 'Tashkent Plov Pilaf', desc: 'The crown jewel: aromatic rice, tender lamb, yellow carrots, and cumin', tag: 'Signature Dish' } },
    { id: 'm12', category: 'mains', price: 120, ru: { name: 'Манты', desc: 'Сочные паровые узбекские манты с рубленым мясом и луком', tag: 'На пару' }, ro: { name: 'Manti Uzbec', desc: 'Colțunași mari uzbeci gătiți la abur cu carne tocată și ceapă', tag: 'La Abur' }, en: { name: 'Steamed Manty', desc: 'Large steamed Uzbek dumplings filled with spiced minced meat and onions', tag: 'Steamed' } },
    { id: 'm13', category: 'mains', price: 130, ru: { name: 'Казан кебаб', desc: 'Обжаренные до корочки баранины ребра с румяным картофелем из казана', tag: 'Хит' }, ro: { name: 'Kazan Kebab', desc: 'Coaste de berbecuț rumenite la ceaun cu cartofi aurii', tag: 'Delicios' }, en: { name: 'Kazan Kebab', desc: 'Crispy fried lamb ribs served with golden potatoes straight from the kazan', tag: 'Kazan Roasted' } },
    { id: 'm14', category: 'mains', price: 150, ru: { name: 'Вырезка из телятины', desc: 'Отборная телятина на раскаленной сковороде с овощами', tag: 'Премиум' }, ro: { name: 'Mușchi de Mânzat', desc: 'Carne selectă de vită la tigaie cu legume proaspete', tag: 'Premium' }, en: { name: 'Veal Tenderloin Strips', desc: 'Prime veal tenderloin stir-fried with fresh crisp vegetables', tag: 'Premium' } },
    { id: 'm15', category: 'mains', price: 150, ru: { name: 'Блюдо от Шеф-Повара', desc: 'Эксклюзивное ежедневное авторское блюдо от нашего Шефа', tag: 'Шеф-Повар' }, ro: { name: 'Specialitatea Bucătarului', desc: 'Preparat exclusiv creat zilnic de Bucătarul nostru Șef', tag: 'Chef Special' }, en: { name: "Chef's Special Creation", desc: "Exclusive signature dish crafted daily by our Uzbek Master Chef", tag: "Chef Special" } },
    { id: 'm16', category: 'mains', price: 120, ru: { name: 'Шашлык из говядины', desc: 'Сочные маринованные кусочки говядины на углях', tag: 'Мангал' }, ro: { name: 'Frigărui de Vită', desc: 'Bucăți suculente de vită marinate și frapte la grătar', tag: 'Grătar' }, en: { name: 'Beef Shashlik Skewer', desc: 'Tender marinated beef cubes grilled over open charcoal embers', tag: 'Charcoal' } },
    { id: 'm17', category: 'mains', price: 120, ru: { name: 'Шашлык из баранины', desc: 'Нежная баранина с ароматом дымка и зиры', tag: 'На углях' }, ro: { name: 'Frigărui de Berbecuț', desc: 'Carne fragedă de berbecuț cu aromă de fum și condimente', tag: 'La Cărbuni' }, en: { name: 'Lamb Shashlik Skewer', desc: 'Succulent lamb skewers infused with cumin, garlic, and smoke', tag: 'Charcoal' } },
    { id: 'm18', category: 'mains', price: 120, ru: { name: 'Люля-кебаб из курицы', desc: 'Нежный рубленый фарш из куриного филе на мангале', tag: 'Сочное' }, ro: { name: 'Lula-Kebab de Pui', desc: 'Carne tocată de pui cu verdeață pregătită la grătar', tag: 'Fraged' }, en: { name: 'Chicken Lyulya Kebab', desc: 'Minced chicken breast skewered and charcoal-grilled with herbs', tag: 'Grilled' } },
    { id: 'm19', category: 'mains', price: 120, ru: { name: 'Люля-кебаб из баранины', desc: 'Классический люля-кебаб из баранины с луком и кориандром', tag: 'Традиции' }, ro: { name: 'Lula-Kebab de Berbecuț', desc: 'Lula-kebab tradițional din carne de berbecuț cu condimente', tag: 'Tradițional' }, en: { name: 'Lamb Lyulya Kebab', desc: 'Traditional ground lamb kebab seasoned with coriander and grilled', tag: 'Traditional' } },
    { id: 'b1', category: 'bar', price: 30, ru: { name: 'Экспрессо', desc: 'Бодрящий эспрессо двойного обжара', tag: 'Кофе' }, ro: { name: 'Espresso', desc: 'Espresso clasic tare și aromat', tag: 'Creație' }, en: { name: 'Espresso', desc: 'Rich and bold single shot espresso', tag: 'Coffee' } },
    { id: 'b2', category: 'bar', price: 35, ru: { name: 'Американо', desc: 'Классический черный кофе', tag: 'Кофе' }, ro: { name: 'Americano', desc: 'Cafea neagră clasică', tag: 'Cafea' }, en: { name: 'Americano', desc: 'Classic long black coffee', tag: 'Coffee' } },
    { id: 'b3', category: 'bar', price: 40, ru: { name: 'Капучино', desc: 'С пышной молочной пенкой', tag: 'Кофе' }, ro: { name: 'Cappuccino', desc: 'Cu spumă fină de lapte', tag: 'Cafea' }, en: { name: 'Cappuccino', desc: 'Espresso topped with creamy frothed milk', tag: 'Coffee' } },
    { id: 'b4', category: 'bar', price: 45, ru: { name: 'Латте', desc: 'Нежный кофе с мягким молоком', tag: 'Кофе' }, ro: { name: 'Latte', desc: 'Cafea delicată cu lapte cremos', tag: 'Cafea' }, en: { name: 'Caffè Latte', desc: 'Smooth espresso with steamed fresh milk', tag: 'Coffee' } },
    { id: 'b5', category: 'bar', price: 60, ru: { name: 'Эспрессо тоник', desc: 'Освежающий микс эспрессо и тоника со льдом', tag: 'Холодное' }, ro: { name: 'Espresso Tonic', desc: 'Mix răcoritor de espresso și apă tonică cu gheață', tag: 'Răcoritor' }, en: { name: 'Espresso Tonic', desc: 'Refreshing layered espresso and tonic water over ice', tag: 'Iced Coffee' } },
    { id: 'b6', category: 'bar', price: 60, ru: { name: 'Бамбо (Bumble)', desc: 'Слоистый кофейный напиток с апельсиновым соком', tag: 'Авторское' }, ro: { name: 'Bumble Coffee', desc: 'Băutură de cafea în straturi cu suc de portocale', tag: 'Special' }, en: { name: 'Bumble Coffee', desc: 'Layered iced espresso with orange juice and caramel syrup', tag: 'Signature' } },
    { id: 'b7', category: 'bar', price: 45, ru: { name: 'Айс латте', desc: 'Освежающий холодный латте со льдом', tag: 'Кофе' }, ro: { name: 'Ice Latte', desc: 'Latte rece și răcoritor cu gheață', tag: 'Rece' }, en: { name: 'Iced Latte', desc: 'Chilled espresso with cold milk over ice', tag: 'Iced Coffee' } },
    { id: 'b8', category: 'bar', price: 50, ru: { name: 'Айс латте карамель', desc: 'Холодный латте со сладкой карамелью', tag: 'Сладкое' }, ro: { name: 'Ice Latte Caramel', desc: 'Latte rece cu sos dulce de caramel', tag: 'Dulce' }, en: { name: 'Caramel Iced Latte', desc: 'Chilled iced latte with sweet caramel swirl', tag: 'Sweet' } },
    { id: 'b9', category: 'bar', price: 110, ru: { name: 'Апероль Сприц', desc: 'Игристый аперитив с нотами апельсина', tag: 'Коктейль' }, ro: { name: 'Aperol Spritz', desc: 'Cocktail spumant cu note de portocală', tag: 'Cocktail' }, en: { name: 'Aperol Spritz', desc: 'Classic sparkling cocktail with Aperol and Prosecco', tag: 'Cocktail' } },
    { id: 'b10', category: 'bar', price: 40, ru: { name: 'Вино белое (бокал)', desc: 'Изысканное сухое белое вино', tag: 'Вино' }, ro: { name: 'Vin Alb (pahar)', desc: 'Vin alb sec rafinat', tag: 'Vin' }, en: { name: 'White Wine (glass)', desc: 'Crisp dry white wine glass', tag: 'Wine' } },
    { id: 'b11', category: 'bar', price: 40, ru: { name: 'Вино красное (бокал)', desc: 'Насыщенное красное вино', tag: 'Вино' }, ro: { name: 'Vin Roșu (pahar)', desc: 'Vin roșu sec aromat', tag: 'Vin' }, en: { name: 'Red Wine (glass)', desc: 'Rich full-bodied red wine glass', tag: 'Wine' } },
    { id: 'b12', category: 'bar', price: 60, ru: { name: 'Дунканы тёмное', desc: 'Тёмное бархатистое пиво', tag: 'Пиво' }, ro: { name: 'Bere Neagră Duncan', desc: 'Bere neagră cremoasă', tag: 'Bere' }, en: { name: 'Dunkel Dark Beer', desc: 'Rich velvet dark craft beer', tag: 'Beer' } },
    { id: 'b13', category: 'bar', price: 60, ru: { name: 'Карлсберг', desc: 'Светлое лагерное пиво', tag: 'Пиво' }, ro: { name: 'Bere Carlsberg', desc: 'Bere blondă de calitate', tag: 'Bere' }, en: { name: 'Carlsberg Beer', desc: 'Premium blond lager beer', tag: 'Beer' } },
    { id: 'b14', category: 'bar', price: 40, ru: { name: 'Львовское', desc: 'Освежающее светлое пиво', tag: 'Пиво' }, ro: { name: 'Bere Lvivske', desc: 'Bere blondă răcoritoare', tag: 'Bere' }, en: { name: 'Lvivske Beer', desc: 'Refreshing light pale beer', tag: 'Beer' } }
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
      card.innerHTML = `
        <div>
          <div class="card-top">
            <h3 class="card-title">${itemLang.name}</h3>
            <span class="card-price">${item.price} ${dict.currency}</span>
          </div>
          <span style="font-size: 0.75rem; color: var(--color-gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; display: block;">
            <i class="fa-solid fa-tag"></i> ${itemLang.tag}
          </span>
          <p class="card-desc">${itemLang.desc}</p>
        </div>
        <div class="card-footer">
          <span style="font-size: 0.8rem; color: var(--color-text-muted);">Tashkent Caravan</span>
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
        const actionStr = targetState ? 'ОТКРЫТЬ (Включить)' : 'ЗАКРЫТЬ (Выключить)';
        const pin = prompt(`ГЛОБАЛЬНОЕ УПРАВЛЕНИЕ САЙТОМ:\nВы хотите ${actionStr} сайт для ВСЕХ клиентов на ВСЕХ устройствах в мире?\nВведите PIN-код владельца:`);
        if (pin) {
          await toggleGlobalSiteStatus(targetState, pin);
        }
      }
    });
  }

  // Initial Load: Fetch global status from Vercel Serverless API
  fetchGlobalSiteStatus();
  setLanguage('ru');
});
