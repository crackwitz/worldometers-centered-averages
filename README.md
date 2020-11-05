# worldometers-centered-averages

worldometers.info plots 3-day/7-day moving averages. unfortunately they are
phase shifted. you can see that when numbers go up and down.

this script rewrites the data contained in a page's javascript to adjust for the
phase shift.

necessarily, what you see then stops a few days before the last data point
because the sliding window extends into both the past and future, but it is now
centered on the day for which the average is calculated. the average will no
longer lag behind.
