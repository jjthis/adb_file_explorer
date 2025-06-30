import { motion } from "framer-motion";
function animation() {
    return (
        <motion.div
            key={item}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="result"
        >
            {items[item] || '❓ 아무 것도 선택되지 않았어요.'}
        </motion.div>
    );
}

function getSort(item, sortOption, sortOrder, grep) {
    let command = 'ls -lA ' + item;
    if (item[item.length - 1] !== '/')
        command += '/';
    command += grep;
    let awknum = 8;
    if (sortOption === 'date') {
        command += ` |awk '{print \$6, \$7, \$8}' | sort`;
        awknum = 3;
    }
    else if (sortOption === 'size') {
        command += ` | awk '{print \$5, \$8}' | sort -n`;
        awknum = 2;
    }
    else if (sortOption === 'type')
        command += ' | sort -t . -k 2';
    else
        command += ' | sort';

    command += ' -k 1';
    if (sortOrder === 'desc') command += ' -r';

    command += ` | awk '{print $${awknum}}'`;
    return command;
}