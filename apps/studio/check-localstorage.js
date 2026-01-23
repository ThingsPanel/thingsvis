// 在浏览器控制台运行这段代码
console.log('=== localStorage Debug ===');
console.log('All keys:', Object.keys(localStorage));
console.log('\nThingsVis keys:');
Object.keys(localStorage).forEach(key => {
  if (key.includes('thingsvis')) {
    const value = localStorage.getItem(key);
    console.log(`\n${key}:`);
    try {
      console.log(JSON.parse(value));
    } catch {
      console.log(value);
    }
  }
});

console.log('\n=== Expected Keys ===');
console.log('thingsvis_token:', localStorage.getItem('thingsvis_token'));
console.log('thingsvis_token_expiry:', localStorage.getItem('thingsvis_token_expiry'));
console.log('thingsvis_user:', localStorage.getItem('thingsvis_user'));
