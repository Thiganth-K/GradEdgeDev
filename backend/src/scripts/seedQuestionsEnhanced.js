const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const Question = require('../models/Question');
const Institution = require('../models/Institution');

// Helper function to create question with all required fields
const createQuestion = (text, options, correctIndex, category, subtopic, difficulty, tags) => ({
  text,
  options,
  correctIndex,
  category,
  subtopic,
  difficulty,
  tags,
});

// APTITUDE QUESTIONS - 50+ questions
const aptitudeQuestions = [
  createQuestion('If a train travels 120 km in 2 hours, what is its average speed?', ['50 km/h', '60 km/h', '70 km/h', '80 km/h'], 1, 'aptitude', 'Speed Distance Time', 'easy', ['speed', 'distance', 'time']),
  createQuestion('A car travels at 80 km/h for 3 hours. How far does it travel?', ['200 km', '240 km', '260 km', '280 km'], 1, 'aptitude', 'Speed Distance Time', 'easy', ['speed', 'distance', 'time']),
  createQuestion('Two trains are traveling towards each other at 60 km/h and 40 km/h. If they are 300 km apart, when will they meet?', ['2 hours', '3 hours', '4 hours', '5 hours'], 1, 'aptitude', 'Speed Distance Time', 'medium', ['speed', 'distance', 'time']),
  createQuestion('What is 15% of 200?', ['25', '30', '35', '40'], 1, 'aptitude', 'Percentages', 'easy', ['percentage', 'calculation']),
  createQuestion('If 40% of a number is 80, what is the number?', ['180', '200', '220', '240'], 1, 'aptitude', 'Percentages', 'easy', ['percentage', 'calculation']),
  createQuestion('A price increases from $50 to $65. What is the percentage increase?', ['25%', '30%', '35%', '40%'], 1, 'aptitude', 'Percentages', 'medium', ['percentage', 'calculation']),
  createQuestion('What is 25% of 25% of 400?', ['20', '25', '30', '35'], 1, 'aptitude', 'Percentages', 'medium', ['percentage', 'calculation']),
  createQuestion('A shopkeeper sells an item for $450 after giving a 10% discount. What was the original price?', ['$500', '$495', '$505', '$480'], 0, 'aptitude', 'Profit and Loss', 'medium', ['discount', 'profit-loss']),
  createQuestion('An article is sold at a profit of 20%. If the cost price is $100, what is the selling price?', ['$110', '$120', '$130', '$140'], 1, 'aptitude', 'Profit and Loss', 'easy', ['profit-loss']),
  createQuestion('If selling price is $120 and profit is 20%, what is the cost price?', ['$90', '$95', '$100', '$105'], 2, 'aptitude', 'Profit and Loss', 'medium', ['profit-loss']),
  createQuestion('A trader marks his goods 40% above cost price and gives a discount of 25%. What is his profit percentage?', ['5%', '10%', '15%', '20%'], 0, 'aptitude', 'Profit and Loss', 'hard', ['profit-loss', 'discount']),
  createQuestion('If 3x + 5 = 20, what is the value of x?', ['3', '4', '5', '6'], 2, 'aptitude', 'Algebra', 'easy', ['algebra', 'equations']),
  createQuestion('If 2x - 7 = 13, what is x?', ['8', '9', '10', '11'], 2, 'aptitude', 'Algebra', 'easy', ['algebra', 'equations']),
  createQuestion('Solve for x: 5x + 2 = 3x + 10', ['2', '3', '4', '5'], 2, 'aptitude', 'Algebra', 'medium', ['algebra', 'equations']),
  createQuestion('If x² = 64, what are the possible values of x?', ['8 only', '-8 only', '8 and -8', 'None'], 2, 'aptitude', 'Algebra', 'medium', ['algebra', 'equations']),
  createQuestion('The ratio of boys to girls in a class is 3:2. If there are 15 boys, how many girls are there?', ['8', '10', '12', '15'], 1, 'aptitude', 'Ratios and Proportions', 'medium', ['ratio', 'proportion']),
  createQuestion('If A:B = 2:3 and B:C = 4:5, what is A:C?', ['8:15', '6:15', '2:5', '8:12'], 0, 'aptitude', 'Ratios and Proportions', 'hard', ['ratio', 'proportion']),
  createQuestion('Divide $500 in the ratio 2:3. What is the larger share?', ['$200', '$250', '$300', '$350'], 2, 'aptitude', 'Ratios and Proportions', 'medium', ['ratio', 'proportion']),
  createQuestion('What is the next number in the series: 2, 6, 12, 20, 30, ?', ['38', '40', '42', '44'], 2, 'aptitude', 'Series and Patterns', 'medium', ['series', 'patterns']),
  createQuestion('Find the next number: 1, 4, 9, 16, 25, ?', ['30', '32', '36', '40'], 2, 'aptitude', 'Series and Patterns', 'easy', ['series', 'patterns']),
  createQuestion('What comes next: 2, 6, 18, 54, ?', ['108', '126', '144', '162'], 3, 'aptitude', 'Series and Patterns', 'medium', ['series', 'patterns']),
  createQuestion('Complete the series: 5, 10, 20, 40, ?', ['60', '70', '80', '90'], 2, 'aptitude', 'Series and Patterns', 'easy', ['series', 'patterns']),
  createQuestion('A man can complete a work in 10 days. If he works with his son, they complete it in 6 days. How long will the son take alone?', ['12 days', '15 days', '18 days', '20 days'], 1, 'aptitude', 'Time and Work', 'hard', ['work-time', 'efficiency']),
  createQuestion('A can do a work in 15 days and B can do it in 20 days. How long will they take together?', ['8 days', '8.57 days', '10 days', '12 days'], 1, 'aptitude', 'Time and Work', 'medium', ['work-time', 'efficiency']),
  createQuestion('If 12 men can complete a work in 8 days, how many days will 16 men take?', ['4 days', '6 days', '8 days', '10 days'], 1, 'aptitude', 'Time and Work', 'medium', ['work-time', 'efficiency']),
  createQuestion('A clock shows 3:15. What is the angle between the hour and minute hands?', ['0°', '7.5°', '15°', '22.5°'], 1, 'aptitude', 'Clocks and Angles', 'hard', ['clock', 'angles']),
  createQuestion('At what time between 3 and 4 o\'clock will the hands of a clock be together?', ['3:16.36', '3:18.18', '3:15', '3:20'], 0, 'aptitude', 'Clocks and Angles', 'hard', ['clock', 'angles']),
  createQuestion('Find simple interest on $1000 at 5% per annum for 2 years.', ['$50', '$75', '$100', '$125'], 2, 'aptitude', 'Interest Calculations', 'easy', ['interest', 'calculation']),
  createQuestion('What principal will amount to $1210 at 10% per annum simple interest in 2 years?', ['$900', '$950', '$1000', '$1050'], 2, 'aptitude', 'Interest Calculations', 'medium', ['interest', 'calculation']),
  createQuestion('The average of 5 numbers is 20. If one number is excluded, the average becomes 18. What is the excluded number?', ['24', '26', '28', '30'], 2, 'aptitude', 'Averages', 'medium', ['average', 'calculation']),
  createQuestion('Find the average of 10, 20, 30, 40, 50.', ['25', '30', '35', '40'], 1, 'aptitude', 'Averages', 'easy', ['average', 'calculation']),
  createQuestion('A father is 3 times as old as his son. After 12 years, he will be twice as old. What is the son\'s current age?', ['10 years', '12 years', '15 years', '18 years'], 1, 'aptitude', 'Age Problems', 'hard', ['ages', 'algebra']),
  createQuestion('The sum of ages of 5 children is 50 years. What will be their sum after 10 years?', ['60 years', '75 years', '100 years', '150 years'], 2, 'aptitude', 'Age Problems', 'medium', ['ages', 'calculation']),
  createQuestion('What is the probability of getting a head when a coin is tossed?', ['0.25', '0.5', '0.75', '1'], 1, 'aptitude', 'Probability', 'easy', ['probability']),
  createQuestion('Two dice are thrown. What is the probability of getting a sum of 7?', ['1/6', '1/5', '1/4', '1/3'], 0, 'aptitude', 'Probability', 'medium', ['probability']),
  createQuestion('In how many ways can 5 books be arranged on a shelf?', ['25', '60', '120', '720'], 2, 'aptitude', 'Permutations and Combinations', 'medium', ['permutations', 'combinations']),
  createQuestion('How many 3-letter words can be formed from the letters A, B, C, D, E (without repetition)?', ['30', '40', '50', '60'], 3, 'aptitude', 'Permutations and Combinations', 'medium', ['permutations', 'combinations']),
  createQuestion('What is the area of a rectangle with length 10 cm and width 5 cm?', ['30 cm²', '40 cm²', '50 cm²', '60 cm²'], 2, 'aptitude', 'Geometry', 'easy', ['geometry', 'area']),
  createQuestion('Find the perimeter of a square with side 8 cm.', ['16 cm', '24 cm', '32 cm', '64 cm'], 2, 'aptitude', 'Geometry', 'easy', ['geometry', 'perimeter']),
  createQuestion('What is the area of a circle with radius 7 cm? (Use π = 22/7)', ['44 cm²', '88 cm²', '132 cm²', '154 cm²'], 3, 'aptitude', 'Geometry', 'medium', ['geometry', 'area', 'circle']),
  createQuestion('Convert binary 1101 to decimal.', ['11', '12', '13', '14'], 2, 'aptitude', 'Number Systems', 'medium', ['number-systems', 'binary']),
  createQuestion('What is the LCM of 12 and 18?', ['24', '36', '48', '72'], 1, 'aptitude', 'Number Systems', 'easy', ['number-systems', 'lcm']),
  createQuestion('Find the HCF of 24 and 36.', ['6', '8', '12', '18'], 2, 'aptitude', 'Number Systems', 'easy', ['number-systems', 'hcf']),
  createQuestion('If all roses are flowers and some flowers are red, which conclusion is valid?', ['All roses are red', 'Some roses may be red', 'No roses are red', 'All flowers are roses'], 1, 'aptitude', 'Logical Reasoning', 'medium', ['logical-reasoning']),
  createQuestion('A is taller than B. B is taller than C. Who is the shortest?', ['A', 'B', 'C', 'Cannot be determined'], 2, 'aptitude', 'Logical Reasoning', 'easy', ['logical-reasoning']),
  createQuestion('If 30% of students passed and 210 failed, how many students appeared for the exam?', ['280', '300', '320', '350'], 1, 'aptitude', 'Data Interpretation', 'medium', ['data-interpretation', 'percentage']),
  createQuestion('In a class of 100 students, 60 play cricket and 50 play football. If 30 play both, how many play neither?', ['10', '15', '20', '25'], 2, 'aptitude', 'Data Interpretation', 'hard', ['data-interpretation', 'sets']),
  createQuestion('If APPLE is coded as BQQMF, how is MANGO coded?', ['NBOHP', 'NBOHO', 'NBOPH', 'NBIOH'], 0, 'aptitude', 'Coding-Decoding', 'medium', ['coding-decoding']),
  createQuestion('If CAT = 24, what is DOG?', ['26', '28', '30', '32'], 2, 'aptitude', 'Coding-Decoding', 'medium', ['coding-decoding']),
  createQuestion('If January 1, 2020 was a Wednesday, what day was January 1, 2021?', ['Thursday', 'Friday', 'Saturday', 'Sunday'], 1, 'aptitude', 'Calendar', 'medium', ['calendar']),
  createQuestion('Pointing to a man, a woman said, "His mother is the only daughter of my mother." How is the woman related to the man?', ['Mother', 'Daughter', 'Sister', 'Aunt'], 0, 'aptitude', 'Blood Relations', 'hard', ['blood-relations']),
];

// TECHNICAL QUESTIONS - 70+ questions
const technicalQuestions = [
  createQuestion('Which data structure uses LIFO (Last In First Out) principle?', ['Queue', 'Stack', 'Array', 'Linked List'], 1, 'technical', 'Data Structures', 'easy', ['data-structures', 'stack']),
  createQuestion('Which data structure uses FIFO (First In First Out) principle?', ['Stack', 'Queue', 'Tree', 'Graph'], 1, 'technical', 'Data Structures', 'easy', ['data-structures', 'queue']),
  createQuestion('What is the worst-case time complexity of searching in a binary search tree?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2, 'technical', 'Data Structures', 'medium', ['data-structures', 'bst', 'complexity']),
  createQuestion('Which data structure is best for implementing a priority queue?', ['Array', 'Linked List', 'Heap', 'Stack'], 2, 'technical', 'Data Structures', 'medium', ['data-structures', 'heap', 'priority-queue']),
  createQuestion('What is the space complexity of a recursive algorithm with depth n?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2, 'technical', 'Algorithms', 'medium', ['algorithms', 'complexity', 'recursion']),
  createQuestion('What is the time complexity of binary search?', ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], 1, 'technical', 'Algorithms', 'easy', ['algorithms', 'complexity']),
  createQuestion('Which sorting algorithm has the best average-case time complexity?', ['Bubble Sort', 'Merge Sort', 'Selection Sort', 'Insertion Sort'], 1, 'technical', 'Algorithms', 'medium', ['algorithms', 'sorting']),
  createQuestion('What is the time complexity of Quick Sort in the worst case?', ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], 2, 'technical', 'Algorithms', 'medium', ['algorithms', 'sorting', 'complexity']),
  createQuestion('Which algorithm is used to find the shortest path in a weighted graph?', ['DFS', 'BFS', 'Dijkstra', 'Kruskal'], 2, 'technical', 'Algorithms', 'medium', ['algorithms', 'graph', 'shortest-path']),
  createQuestion('What is the time complexity of accessing an element in a hash table (average case)?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 0, 'technical', 'Data Structures', 'easy', ['data-structures', 'hash-table', 'complexity']),
  createQuestion('Which SQL command is used to retrieve data from a database?', ['GET', 'RETRIEVE', 'SELECT', 'FETCH'], 2, 'technical', 'Database and SQL', 'easy', ['sql', 'database']),
  createQuestion('What is the purpose of an index in a database?', ['To encrypt data', 'To improve query performance', 'To backup data', 'To compress data'], 1, 'technical', 'Database and SQL', 'medium', ['database', 'indexing', 'performance']),
  createQuestion('Which SQL clause is used to filter results?', ['FILTER', 'WHERE', 'HAVING', 'SELECT'], 1, 'technical', 'Database and SQL', 'easy', ['sql', 'database']),
  createQuestion('What does ACID stand for in database transactions?', ['Atomicity, Consistency, Isolation, Durability', 'Association, Consistency, Integrity, Durability', 'Atomicity, Compression, Isolation, Distribution', 'Association, Consistency, Isolation, Distribution'], 0, 'technical', 'Database and SQL', 'medium', ['database', 'transactions', 'acid']),
  createQuestion('Which type of JOIN returns all records from both tables?', ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], 3, 'technical', 'Database and SQL', 'medium', ['sql', 'joins']),
  createQuestion('What is normalization in databases?', ['Encrypting data', 'Organizing data to reduce redundancy', 'Backing up data', 'Indexing tables'], 1, 'technical', 'Database and SQL', 'medium', ['database', 'normalization']),
  createQuestion('Which SQL command is used to delete all rows from a table without deleting the table structure?', ['DELETE', 'DROP', 'TRUNCATE', 'REMOVE'], 2, 'technical', 'Database and SQL', 'medium', ['sql', 'database']),
  createQuestion('In Object-Oriented Programming, what is encapsulation?', ['Wrapping data and methods into a single unit', 'Creating multiple instances of a class', 'Inheriting properties from parent class', 'Overloading methods'], 0, 'technical', 'Object-Oriented Programming', 'medium', ['oop', 'encapsulation']),
  createQuestion('What is polymorphism in OOP?', ['Creating multiple classes', 'Ability of objects to take multiple forms', 'Hiding data', 'Creating objects'], 1, 'technical', 'Object-Oriented Programming', 'medium', ['oop', 'polymorphism']),
  createQuestion('Which OOP concept allows a class to inherit properties from another class?', ['Encapsulation', 'Polymorphism', 'Inheritance', 'Abstraction'], 2, 'technical', 'Object-Oriented Programming', 'easy', ['oop', 'inheritance']),
  createQuestion('What is method overloading?', ['Having multiple methods with same name but different parameters', 'Overriding a parent class method', 'Creating private methods', 'Using static methods'], 0, 'technical', 'Object-Oriented Programming', 'medium', ['oop', 'overloading']),
  createQuestion('What is an abstract class?', ['A class that cannot be instantiated', 'A class with all private methods', 'A class with no methods', 'A final class'], 0, 'technical', 'Object-Oriented Programming', 'medium', ['oop', 'abstraction']),
  createQuestion('What does REST stand for in web services?', ['Remote Execution Service Technology', 'Representational State Transfer', 'Resource Exchange System Technology', 'Reliable Execution State Transfer'], 1, 'technical', 'Web Technologies', 'medium', ['rest', 'web-services']),
  createQuestion('Which HTTP method is idempotent?', ['POST', 'GET', 'PATCH', 'All of the above'], 1, 'technical', 'Web Technologies', 'medium', ['http', 'rest']),
  createQuestion('What is the purpose of HTTP status code 404?', ['Server Error', 'Not Found', 'Unauthorized', 'Bad Request'], 1, 'technical', 'Web Technologies', 'easy', ['http', 'status-codes']),
  createQuestion('Which HTTP method is used to update a resource?', ['GET', 'POST', 'PUT', 'DELETE'], 2, 'technical', 'Web Technologies', 'easy', ['http', 'rest']),
  createQuestion('What does CORS stand for?', ['Cross-Origin Resource Sharing', 'Cross-Origin Request Security', 'Client-Origin Resource Sharing', 'Cross-Origin Response System'], 0, 'technical', 'Web Technologies', 'medium', ['web', 'security', 'cors']),
  createQuestion('Which HTML5 element is used for drawing graphics?', ['<graphics>', '<draw>', '<canvas>', '<svg>'], 2, 'technical', 'Web Technologies', 'easy', ['html', 'html5']),
  createQuestion('What is JSON?', ['JavaScript Object Notation', 'Java Structured Object Network', 'JavaScript Oriented Notation', 'Java Simple Object Notation'], 0, 'technical', 'Web Technologies', 'easy', ['json', 'web']),
  createQuestion('What is a deadlock in operating systems?', ['When a process runs indefinitely', 'When two or more processes are waiting for each other to release resources', 'When CPU utilization is 100%', 'When memory is full'], 1, 'technical', 'Operating Systems', 'hard', ['os', 'deadlock', 'concurrency']),
  createQuestion('What is virtual memory?', ['Memory that doesn\'t exist', 'RAM memory', 'Using disk space as additional RAM', 'Cache memory'], 2, 'technical', 'Operating Systems', 'medium', ['os', 'memory']),
  createQuestion('What is the purpose of a semaphore in OS?', ['Memory allocation', 'Process synchronization', 'CPU scheduling', 'File management'], 1, 'technical', 'Operating Systems', 'medium', ['os', 'synchronization']),
  createQuestion('Which scheduling algorithm can cause starvation?', ['FCFS', 'Round Robin', 'Priority Scheduling', 'SJF'], 2, 'technical', 'Operating Systems', 'hard', ['os', 'scheduling']),
  createQuestion('What is thrashing in OS?', ['Fast execution', 'Excessive paging activity', 'High CPU usage', 'Memory leak'], 1, 'technical', 'Operating Systems', 'hard', ['os', 'memory', 'paging']),
  createQuestion('In which layer of the OSI model does HTTP operate?', ['Transport Layer', 'Network Layer', 'Application Layer', 'Session Layer'], 2, 'technical', 'Networking', 'medium', ['networking', 'osi', 'http']),
  createQuestion('What is the default port for HTTPS?', ['80', '443', '8080', '3000'], 1, 'technical', 'Networking', 'easy', ['networking', 'https']),
  createQuestion('What does IP stand for?', ['Internet Protocol', 'Internal Protocol', 'Internet Process', 'Internal Process'], 0, 'technical', 'Networking', 'easy', ['networking', 'ip']),
  createQuestion('Which protocol is used for sending emails?', ['HTTP', 'FTP', 'SMTP', 'POP3'], 2, 'technical', 'Networking', 'easy', ['networking', 'email']),
  createQuestion('What is the purpose of DNS?', ['Encrypting data', 'Converting domain names to IP addresses', 'Routing packets', 'Managing emails'], 1, 'technical', 'Networking', 'easy', ['networking', 'dns']),
  createQuestion('Which layer is responsible for routing in the OSI model?', ['Data Link Layer', 'Network Layer', 'Transport Layer', 'Session Layer'], 1, 'technical', 'Networking', 'medium', ['networking', 'osi']),
  createQuestion('What is the subnet mask for a Class C network?', ['255.0.0.0', '255.255.0.0', '255.255.255.0', '255.255.255.255'], 2, 'technical', 'Networking', 'medium', ['networking', 'subnet']),
  createQuestion('Which design pattern ensures a class has only one instance?', ['Factory Pattern', 'Singleton Pattern', 'Observer Pattern', 'Strategy Pattern'], 1, 'technical', 'Design Patterns', 'easy', ['design-patterns', 'singleton']),
  createQuestion('What is the Factory design pattern used for?', ['Creating objects without specifying exact class', 'Ensuring single instance', 'Observing changes', 'Defining algorithms'], 0, 'technical', 'Design Patterns', 'medium', ['design-patterns', 'factory']),
  createQuestion('Which pattern is used to notify multiple objects about state changes?', ['Singleton', 'Factory', 'Observer', 'Adapter'], 2, 'technical', 'Design Patterns', 'medium', ['design-patterns', 'observer']),
  createQuestion('What is the MVC design pattern?', ['Model View Controller', 'Multiple View Control', 'Model Virtual Controller', 'Multiple Virtual Control'], 0, 'technical', 'Design Patterns', 'easy', ['design-patterns', 'mvc']),
  createQuestion('Which programming language is known as a "write once, run anywhere" language?', ['C++', 'Python', 'Java', 'JavaScript'], 2, 'technical', 'Programming Languages', 'easy', ['programming-languages', 'java']),
  createQuestion('What is Python primarily known for?', ['System programming', 'Web development and data science', 'Game development', 'Device drivers'], 1, 'technical', 'Programming Languages', 'easy', ['programming-languages', 'python']),
  createQuestion('Which language is primarily used for iOS app development?', ['Java', 'Kotlin', 'Swift', 'C#'], 2, 'technical', 'Programming Languages', 'easy', ['programming-languages', 'swift']),
  createQuestion('What does JVM stand for?', ['Java Virtual Machine', 'Java Visual Module', 'Java Variable Memory', 'Java Version Manager'], 0, 'technical', 'Programming Languages', 'easy', ['java', 'jvm']),
  createQuestion('What is Agile methodology?', ['A waterfall approach', 'Iterative and incremental development', 'Sequential development', 'Top-down development'], 1, 'technical', 'Software Engineering', 'medium', ['software-engineering', 'agile']),
  createQuestion('What is continuous integration?', ['Deploying to production continuously', 'Integrating code changes frequently', 'Testing manually', 'Writing documentation'], 1, 'technical', 'Software Engineering', 'medium', ['software-engineering', 'ci-cd']),
  createQuestion('What is version control used for?', ['Compiling code', 'Tracking changes in code', 'Running tests', 'Deploying applications'], 1, 'technical', 'Software Engineering', 'easy', ['software-engineering', 'version-control']),
  createQuestion('What does API stand for?', ['Application Programming Interface', 'Advanced Programming Integration', 'Application Process Integration', 'Advanced Process Interface'], 0, 'technical', 'Web Technologies', 'easy', ['api', 'web']),
  createQuestion('What is SQL injection?', ['A type of database optimization', 'A security vulnerability in web applications', 'A SQL command', 'A database feature'], 1, 'technical', 'Security', 'medium', ['security', 'sql']),
  createQuestion('What is the purpose of HTTPS?', ['Faster data transfer', 'Secure communication over network', 'Compression of data', 'Caching data'], 1, 'technical', 'Security', 'easy', ['security', 'https']),
  createQuestion('What is encryption?', ['Compressing data', 'Converting data into unreadable format', 'Backing up data', 'Deleting data'], 1, 'technical', 'Security', 'easy', ['security', 'encryption']),
  createQuestion('What is a linked list?', ['A linear data structure with nodes', 'A tree structure', 'A hash table', 'A sorting algorithm'], 0, 'technical', 'Data Structures', 'easy', ['data-structures', 'linked-list']),
  createQuestion('What is Big O notation used for?', ['Measuring memory usage', 'Describing algorithm efficiency', 'Counting lines of code', 'Defining variables'], 1, 'technical', 'Algorithms', 'easy', ['algorithms', 'complexity']),
  createQuestion('Which of the following is a NoSQL database?', ['MySQL', 'PostgreSQL', 'MongoDB', 'Oracle'], 2, 'technical', 'Database and SQL', 'easy', ['database', 'nosql']),
  createQuestion('What is the purpose of a primary key in a database?', ['To encrypt data', 'To uniquely identify each record', 'To sort data', 'To index all columns'], 1, 'technical', 'Database and SQL', 'easy', ['database', 'keys']),
  createQuestion('What is Git used for?', ['Compiling code', 'Version control and collaboration', 'Running tests', 'Deploying applications'], 1, 'technical', 'Software Engineering', 'easy', ['git', 'version-control']),
  createQuestion('What is a RESTful API?', ['An API following REST principles', 'A database query language', 'A programming language', 'A testing framework'], 0, 'technical', 'Web Technologies', 'medium', ['rest', 'api']),
  createQuestion('What is the difference between GET and POST requests?', ['GET retrieves data, POST submits data', 'GET is faster', 'POST is more secure', 'There is no difference'], 0, 'technical', 'Web Technologies', 'easy', ['http', 'methods']),
  createQuestion('What is a callback function?', ['A function that calls itself', 'A function passed as an argument to another function', 'A function that returns a boolean', 'A function with no parameters'], 1, 'technical', 'Programming Concepts', 'medium', ['programming', 'callbacks']),
  createQuestion('What is the purpose of try-catch blocks?', ['To optimize code', 'To handle exceptions and errors', 'To create loops', 'To define variables'], 1, 'technical', 'Programming Concepts', 'easy', ['programming', 'error-handling']),
  createQuestion('What is recursion?', ['A loop structure', 'A function that calls itself', 'An error condition', 'A data structure'], 1, 'technical', 'Programming Concepts', 'easy', ['programming', 'recursion']),
  createQuestion('What is the purpose of a constructor in OOP?', ['To destroy objects', 'To initialize objects when created', 'To compare objects', 'To copy objects'], 1, 'technical', 'Object-Oriented Programming', 'easy', ['oop', 'constructor']),
];

// PSYCHOMETRIC QUESTIONS - 45+ questions
const psychometricQuestions = [
  createQuestion('When working on a team project with a tight deadline, what is your approach?', ['Take charge and assign tasks to team members', 'Wait for others to suggest a plan', 'Work independently on your part', 'Collaborate and discuss the best approach with the team'], 3, 'psychometric', 'Teamwork and Collaboration', 'medium', ['teamwork', 'leadership']),
  createQuestion('A colleague is struggling with their workload. What would you do?', ['Focus on your own work', 'Offer help if you have spare time', 'Proactively check if they need assistance', 'Tell the manager about their struggle'], 2, 'psychometric', 'Teamwork and Collaboration', 'easy', ['empathy', 'teamwork']),
  createQuestion('During a team meeting, your idea is rejected. How do you respond?', ['Feel offended and withdraw from discussion', 'Accept it and support the chosen idea', 'Keep arguing for your point', 'Complain to colleagues later'], 1, 'psychometric', 'Teamwork and Collaboration', 'medium', ['teamwork', 'adaptability']),
  createQuestion('Two team members have a conflict. What do you do?', ['Stay out of it', 'Take sides with one person', 'Help mediate and find common ground', 'Report to manager immediately'], 2, 'psychometric', 'Conflict Resolution', 'medium', ['conflict-resolution', 'teamwork']),
  createQuestion('How do you handle a situation where you disagree with your manager\'s decision?', ['Follow the decision without question', 'Express your concerns respectfully and provide alternative solutions', 'Complain to colleagues', 'Do the minimum required'], 1, 'psychometric', 'Communication Skills', 'medium', ['conflict-resolution', 'communication']),
  createQuestion('When explaining a complex technical concept to a non-technical person, what is your approach?', ['Use technical jargon to be accurate', 'Avoid the topic as it\'s too complex', 'Use simple language and analogies', 'Ask someone else to explain'], 2, 'psychometric', 'Communication Skills', 'medium', ['communication', 'adaptability']),
  createQuestion('You notice a mistake in a colleague\'s work. What do you do?', ['Ignore it as it\'s not your responsibility', 'Point it out publicly in a meeting', 'Discuss it privately with them in a constructive manner', 'Inform the manager directly'], 2, 'psychometric', 'Communication Skills', 'medium', ['communication', 'professionalism']),
  createQuestion('You receive critical feedback on your work. How do you typically respond?', ['Feel defensive and justify your approach', 'Accept it gracefully and look for improvement opportunities', 'Ignore it and continue as before', 'Ask for specific examples and work on addressing them'], 3, 'psychometric', 'Growth Mindset', 'medium', ['feedback', 'growth-mindset']),
  createQuestion('When learning a new technology or skill, what is your preferred method?', ['Reading documentation and tutorials', 'Hands-on experimentation and projects', 'Taking structured courses', 'Learning from colleagues and mentors'], 1, 'psychometric', 'Growth Mindset', 'medium', ['learning-style', 'growth']),
  createQuestion('You fail to meet a project deadline. What is your reaction?', ['Blame external factors', 'Feel discouraged and lose motivation', 'Analyze what went wrong and plan improvements', 'Avoid similar projects in future'], 2, 'psychometric', 'Growth Mindset', 'medium', ['accountability', 'growth-mindset']),
  createQuestion('A new technology makes your current skill less relevant. How do you respond?', ['Resist the change and stick to what you know', 'Feel anxious about job security', 'Embrace the opportunity to learn new skills', 'Look for a different role'], 2, 'psychometric', 'Adaptability', 'medium', ['adaptability', 'growth-mindset']),
  createQuestion('Which statement best describes your work style?', ['I prefer working alone on clearly defined tasks', 'I thrive in collaborative environments with frequent interaction', 'I like a mix of independent and team work', 'I prefer to lead and delegate tasks'], 2, 'psychometric', 'Work Style', 'easy', ['work-style', 'personality']),
  createQuestion('When do you feel most productive?', ['Early morning with clear goals', 'Late night when it\'s quiet', 'Throughout the day with breaks', 'Under pressure of deadlines'], 0, 'psychometric', 'Work Style', 'easy', ['work-style', 'productivity']),
  createQuestion('How do you approach a large, ambiguous project?', ['Wait for detailed instructions', 'Break it down into smaller tasks and start', 'Ask for help immediately', 'Feel overwhelmed and procrastinate'], 1, 'psychometric', 'Problem Solving', 'medium', ['work-style', 'problem-solving']),
  createQuestion('How do you prioritize tasks when everything seems urgent?', ['Work on the easiest tasks first', 'Ask someone else to prioritize for me', 'Assess impact and dependencies, then create a priority list', 'Work on multiple tasks simultaneously'], 2, 'psychometric', 'Time Management', 'medium', ['time-management', 'prioritization']),
  createQuestion('You have multiple deadlines approaching. What do you do?', ['Focus on one at a time', 'Try to complete all simultaneously', 'Evaluate priorities and allocate time accordingly', 'Ask for deadline extensions'], 2, 'psychometric', 'Time Management', 'medium', ['time-management', 'prioritization']),
  createQuestion('An unexpected urgent task arrives. How do you handle it?', ['Drop everything and work on it', 'Ignore it until you finish current work', 'Assess urgency and adjust priorities', 'Delegate it to someone else'], 2, 'psychometric', 'Time Management', 'medium', ['time-management', 'adaptability']),
  createQuestion('How do you handle stress during high-pressure situations?', ['Take short breaks to clear my mind', 'Work through without stopping', 'Seek support from colleagues or manager', 'Break down problems and tackle them systematically'], 3, 'psychometric', 'Stress Management', 'medium', ['stress-management', 'resilience']),
  createQuestion('You make a significant mistake at work. What do you do?', ['Try to hide it', 'Immediately inform your manager and propose solutions', 'Fix it quietly without telling anyone', 'Blame the tools or circumstances'], 1, 'psychometric', 'Accountability', 'medium', ['accountability', 'integrity']),
  createQuestion('Your project is cancelled after weeks of work. How do you feel?', ['Frustrated and demotivated', 'Accepting it as part of business', 'Disappointed but ready to move to next project', 'Angry at management'], 2, 'psychometric', 'Resilience', 'medium', ['resilience', 'adaptability']),
  createQuestion('When faced with a complex problem, what is your first step?', ['Ask someone for the solution', 'Try random approaches until something works', 'Analyze the problem and gather information', 'Avoid the problem'], 2, 'psychometric', 'Problem Solving', 'easy', ['problem-solving', 'analytical']),
  createQuestion('You have two equally good solutions. How do you decide?', ['Choose randomly', 'Ask others to decide', 'Evaluate pros/cons and potential risks', 'Go with your gut feeling'], 2, 'psychometric', 'Decision Making', 'medium', ['decision-making', 'analytical']),
  createQuestion('When debugging a difficult issue, what is your approach?', ['Keep trying different things randomly', 'Ask for help immediately', 'Systematically isolate and test components', 'Take a break and hope it resolves itself'], 2, 'psychometric', 'Problem Solving', 'medium', ['problem-solving', 'technical-aptitude']),
  createQuestion('Your team lacks direction on a project. What do you do?', ['Wait for someone to take charge', 'Suggest a plan and coordinate team efforts', 'Work on your part independently', 'Escalate to management'], 1, 'psychometric', 'Leadership', 'medium', ['leadership', 'initiative']),
  createQuestion('You identify a process improvement opportunity. What do you do?', ['Keep quiet as it\'s not your role', 'Document it and present to team', 'Implement it without telling anyone', 'Mention it casually and forget'], 1, 'psychometric', 'Initiative', 'medium', ['initiative', 'improvement']),
  createQuestion('You discover a security vulnerability in your company\'s product. What do you do?', ['Ignore it as it\'s not your department', 'Immediately report it through proper channels', 'Tell friends about it', 'Try to exploit it to prove severity'], 1, 'psychometric', 'Ethics and Professionalism', 'easy', ['ethics', 'professionalism']),
  createQuestion('A client asks you to implement something unethical. How do you respond?', ['Do it to please the client', 'Refuse politely and explain concerns', 'Ignore the request', 'Do it but tell your manager'], 1, 'psychometric', 'Ethics and Professionalism', 'medium', ['ethics', 'professionalism']),
  createQuestion('Your company adopts a new tool that changes your workflow. How do you react?', ['Resist and continue old methods', 'Complain but eventually adapt', 'Embrace it and help others learn', 'Look for ways to avoid using it'], 2, 'psychometric', 'Adaptability', 'medium', ['adaptability', 'change-management']),
  createQuestion('Your role responsibilities change significantly. What is your response?', ['Feel anxious and resistant', 'View it as growth opportunity', 'Look for another job', 'Do minimum required'], 1, 'psychometric', 'Adaptability', 'medium', ['adaptability', 'growth-mindset']),
  createQuestion('How do you ensure quality in your work?', ['Rely on others to catch mistakes', 'Review once quickly before submitting', 'Use systematic checks and peer reviews', 'Assume it\'s fine if it works'], 2, 'psychometric', 'Attention to Detail', 'medium', ['quality', 'attention-to-detail']),
  createQuestion('You notice a small inconsistency in documentation. What do you do?', ['Ignore it as it\'s minor', 'Fix it immediately', 'Make a note to fix later', 'Tell someone else to fix it'], 1, 'psychometric', 'Attention to Detail', 'easy', ['attention-to-detail', 'quality']),
  createQuestion('A user reports a confusing feature. How do you respond?', ['Explain that they should read the manual', 'Listen to feedback and consider improvements', 'Ignore as most users don\'t complain', 'Blame the user for not understanding'], 1, 'psychometric', 'Customer Focus', 'medium', ['customer-focus', 'empathy']),
  createQuestion('Customer requirements conflict with technical best practices. What do you do?', ['Follow customer blindly', 'Ignore customer and do what\'s technical best', 'Discuss trade-offs and find balanced solution', 'Escalate decision to management'], 2, 'psychometric', 'Customer Focus', 'hard', ['customer-focus', 'problem-solving']),
  createQuestion('What is your biggest weakness in a professional setting?', ['I don\'t have any weaknesses', 'Sometimes I focus too much on perfection', 'I struggle with time management but am working to improve', 'I don\'t like working with others'], 2, 'psychometric', 'Self-Awareness', 'medium', ['self-awareness', 'honesty']),
  createQuestion('How do you measure your own success?', ['By comparing with colleagues', 'By salary and promotions only', 'By impact of work and personal growth', 'By working least hours possible'], 2, 'psychometric', 'Self-Awareness', 'medium', ['self-awareness', 'motivation']),
  createQuestion('How do you approach creative problem-solving?', ['Stick to proven methods', 'Try unconventional approaches', 'Brainstorm multiple solutions before deciding', 'Copy what others have done'], 2, 'psychometric', 'Innovation', 'medium', ['creativity', 'innovation']),
  createQuestion('Your idea is innovative but risky. What do you do?', ['Abandon it immediately', 'Present it with risk analysis and mitigation plan', 'Implement it secretly', 'Only mention the benefits'], 1, 'psychometric', 'Innovation', 'medium', ['innovation', 'risk-management']),
  createQuestion('What motivates you most at work?', ['Salary and benefits', 'Recognition and praise', 'Solving challenging problems and learning', 'Having minimal responsibilities'], 2, 'psychometric', 'Motivation', 'easy', ['motivation', 'values']),
  createQuestion('You complete your assigned work early. What do you do?', ['Relax and wait for next assignment', 'Look for ways to help team or improve processes', 'Leave early', 'Pretend to be busy'], 1, 'psychometric', 'Initiative', 'medium', ['initiative', 'motivation']),
  createQuestion('How do you maintain work-life balance?', ['Work is life, no separation needed', 'Set clear boundaries and priorities', 'Always choose work over personal life', 'Avoid work as much as possible'], 1, 'psychometric', 'Work-Life Balance', 'easy', ['work-life-balance', 'wellness']),
  createQuestion('You are asked to work over the weekend for an urgent task. How do you respond?', ['Refuse without consideration', 'Agree reluctantly and complain', 'Assess urgency, discuss alternatives, and decide', 'Always agree to show commitment'], 2, 'psychometric', 'Work-Life Balance', 'medium', ['work-life-balance', 'professionalism']),
  createQuestion('You work with a team member from a very different background. How do you approach collaboration?', ['Avoid interaction as much as possible', 'Expect them to adapt to your style', 'Learn about their perspective and find common ground', 'Focus only on work, ignore differences'], 2, 'psychometric', 'Diversity and Inclusion', 'medium', ['diversity', 'teamwork']),
  createQuestion('How do you handle constructive criticism?', ['Get defensive', 'Ignore it', 'Thank them and reflect on the feedback', 'Argue your point'], 2, 'psychometric', 'Growth Mindset', 'easy', ['feedback', 'growth']),
  createQuestion('What do you do when you don\'t know the answer to a question?', ['Pretend to know', 'Say "I don\'t know" and move on', 'Admit you don\'t know and offer to find out', 'Blame others'], 2, 'psychometric', 'Honesty and Integrity', 'easy', ['honesty', 'professionalism']),
  createQuestion('How do you celebrate team successes?', ['Take credit for yourself', 'Don\'t acknowledge them', 'Recognize everyone\'s contributions', 'Only acknowledge managers'], 2, 'psychometric', 'Teamwork and Collaboration', 'easy', ['teamwork', 'recognition']),
  createQuestion('When you make a promise at work, how seriously do you take it?', ['Not very seriously', 'Depends on the situation', 'Very seriously, I always follow through', 'I avoid making promises'], 2, 'psychometric', 'Accountability', 'easy', ['accountability', 'reliability']),
];

async function seedQuestions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find the first institution to associate questions with
    const institution = await Institution.findOne();
    if (!institution) {
      console.log('⚠️  No institution found. Questions will be created without institution association.');
    }

    const institutionId = institution ? institution._id : null;

    // Prepare all questions with proper option format and inLibrary flag
    const allQuestions = [
      ...aptitudeQuestions.map(q => ({ 
        ...q, 
        createdBy: institutionId, 
        inLibrary: true,  // Mark as in library
        options: q.options.map(text => ({ text })) 
      })),
      ...technicalQuestions.map(q => ({ 
        ...q, 
        createdBy: institutionId, 
        inLibrary: true,  // Mark as in library
        options: q.options.map(text => ({ text })) 
      })),
      ...psychometricQuestions.map(q => ({ 
        ...q, 
        createdBy: institutionId, 
        inLibrary: true,  // Mark as in library
        options: q.options.map(text => ({ text })) 
      })),
    ];

    // Insert all questions
    const inserted = await Question.insertMany(allQuestions);
    
    console.log(`\n✅ Successfully seeded ${inserted.length} questions:`);
    console.log(`   📚 ${aptitudeQuestions.length} Aptitude questions`);
    console.log(`   💻 ${technicalQuestions.length} Technical questions`);
    console.log(`   🧠 ${psychometricQuestions.length} Psychometric questions`);
    
    // Add all questions to Library collection
    const Library = require('../models/Library');
    let libraryCount = 0;
    
    for (const q of inserted) {
      try {
        // Map category to main topic
        const topicMap = {
          'aptitude': 'Aptitude',
          'technical': 'Technical',
          'psychometric': 'Psychometric'
        };
        const topic = topicMap[q.category] || 'Aptitude';
        
        await Library.addQuestionToLibrary(q._id, topic, q.subtopic);
        libraryCount++;
      } catch (err) {
        console.error(`⚠️  Failed to add question ${q._id} to library:`, err.message);
      }
    }
    
    console.log(`\n✅ Added ${libraryCount} questions to Library collection`);
    console.log('\n📊 Question Distribution:');
    console.log(`   Total: ${inserted.length} questions`);
    console.log(`   This is sufficient for FRI tests with various ratios (e.g., 25% apt, 50% tech, 25% psych)`);
    console.log(`\n✨ You can now create FRI tests with any question ratio!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    process.exit(1);
  }
}

seedQuestions();
