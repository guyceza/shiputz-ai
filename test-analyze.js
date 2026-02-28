const fs = require('fs');

async function testAnalyze() {
  const imageData = fs.readFileSync('/home/ubuntu/clawd/projects/shiputz-ai/reference-blueprint.jpg');
  const base64 = `data:image/jpeg;base64,${imageData.toString('base64')}`;
  
  console.log('Sending to analyze-blueprint API...');
  
  const response = await fetch('https://shipazti.com/api/lab/analyze-blueprint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 })
  });
  
  if (!response.ok) {
    console.error('Error:', response.status, await response.text());
    return;
  }
  
  const data = await response.json();
  console.log('Result:');
  console.log(JSON.stringify(data, null, 2));
  
  // Save for testing
  fs.writeFileSync('/home/ubuntu/clawd/projects/shiputz-ai/test-blueprint-result.json', JSON.stringify(data, null, 2));
  console.log('Saved to test-blueprint-result.json');
}

testAnalyze().catch(console.error);
