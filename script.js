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
    reactions.sort((a, b) => +a.user_id - +b.user_id);
    const userLikedJobs = reactions.reduce((acc, reaction) => {
      const { user_id, job_id, direction } = reaction;
      if (direction) {
        const userData = {
          user_id: user_id,
          jobs: [job_id],
        };
        if (acc.length && acc[acc.length - 1].user_id === user_id) {
          acc[acc.length - 1].jobs.push(job_id);
        } else acc.push(userData);
      }
      return acc;
    }, []);
    // console.log(userLikedJobs.length);

    const jobsLikedByUsers = reactions.reduce((acc, reaction) => {
      const { user_id, job_id, direction } = reaction;
      if (direction) {
        if (acc[job_id]) acc[job_id].push(user_id);
        else acc[job_id] = [user_id];
      }
      return acc;
    }, {});
    console.log(Object.keys(jobsLikedByUsers).length);
  })
  .on('error', error => console.error(error.message));
