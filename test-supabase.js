import { supabase } from './src/lib/supabase.node.js';

async function test() {
    console.log('Тестирование подключения к Supabase...');
    
    // Простая проверка подключения
    const { data, error } = await supabase
        .from('your_table_name')  // замените на имя вашей таблицы
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Ошибка:', error.message);
    } else {
        console.log('Успешное подключение!');
        console.log('Данные:', data);
    }
}

test();