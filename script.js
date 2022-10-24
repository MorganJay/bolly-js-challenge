import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

const reactions = [];

createReadStream('./reactions.csv')
  .pipe(parse({ delimiter: ',', from_line: 2 }))
  .on('data', row => {
    const reaction = {
      user_id: row[0],
      job_id: row[1],
      direction: row[2] === 'true',
      dateTime: row[3],
    };
    // if (!reactions.length) reactions.push(reaction);
    // else {
    //   if (Number(reactions[reactions.length - 1].user_id) < +reaction.user_id)
    //     reactions.push(reaction);
    //   else reactions.unshift(reaction);
    // }
    reactions.push(reaction);
  })
  .on('end', () => {
    reactions.sort((a, b) => +a.job_id - +b.job_id);
    const userLikedJobs = reactions.reduce((acc, reaction) => {
      const { user_id, job_id, direction } = reaction;
      if (direction) {
        const userData = {
          job_id,
          users: [user_id],
          likes : 1
        };
        if (acc.length && acc[acc.length - 1].job_id === job_id) {
         if(!acc[acc.length - 1].users.includes(user_id)) acc[acc.length - 1].users.push(user_id);
          acc[acc.length - 1].likes++;
        } else acc.push(userData);
      }
      return acc;
    }, []);
    console.log(userLikedJobs.sort((a , b) => b.likes - a.likes));

    // const jobsLikedByUsers = reactions.reduce((acc, reaction) => {
    //   const { user_id, job_id, direction } = reaction;
    //   if (direction) {
    //     if (acc[job_id] && !acc[job_id].includes(user_id)) acc[job_id].push(user_id);
    //     else acc[job_id] = [user_id];
    //   }
    //   return acc;
    // }, {});
  })
  .on('error', error => console.error(error.message));
