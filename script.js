import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

const reactions = [];

createReadStream('./reactions.csv')
  .pipe(parse({ delimiter: ',', from_line: 2 }))
  .on('data', row => {
    const reaction = {
      user_id: row[0],
      job_id: row[1],
      direction: row[2],
      dateTime: row[3],
    };
    reactions.push(reaction);
  })
  .on('end', () => {
    console.log(reactions.length);
  })
  .on('error', error => console.error(error.message));
