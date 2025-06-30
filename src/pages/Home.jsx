import { useSearchParams } from 'react-router-dom';
import './Home.css';
import { useEffect, useState } from "react";
import Sidebar from "./Slidebar.jsx";

const init = '-initStorage';

function getSort(item, sortOption, sortOrder, grep) {
    if (!item.endsWith('/')) item += '/';
    let command = `find "${item}" -maxdepth 1 -mindepth 1 ${grep} -exec stat -c '%F|%s|%y|%n' {} +`;

    if (sortOption === 'date') {
        command += ` | sort -t '|' -k3`;
    } else if (sortOption === 'size') {
        command += ` | sort -t '|' -k2 -n`;
    } else if (sortOption === 'type') {
        command += ` | sort -t '|' -k1`;
    } else {
        command += ` | sort -t '|' -k4`;
    }

    if (sortOrder === 'desc') {
        command += ` -r`;
    }

    command += ` | cut -d'|' -f4 | sed 's:.*/::'`;

    return command;
}

function renderPath(item, handleClick, refreshKey, sortOption = 'name', sortOrder = 'asc', searchText = '') {
    const [output, setOutput] = useState([]);

    const command =
        getSort(item, sortOption, sortOrder, " -type d ") + '; '
        + getSort(item, sortOption, sortOrder, " ! -type d ");

    ///console.log("[command] " + command);

    useEffect(() => {
        const runCommand = async () => {
            try {
                if (item === init) {
                    const result = await window.electron.ipcRenderer.invoke('get-favorite');
                    setOutput(result);
                } else {
                    const result = await window.electron.ipcRenderer.invoke('exec-command', command); // 예: 유닉스용
                    setOutput(result);
                }
            } catch (err) {
                setOutput('에러: ' + err);
            }
        };
        runCommand().then((x) => {
            console.log("[runCommand then] " + x);
        });
    }, [item, sortOption, sortOrder, refreshKey]);


    if (typeof output === 'object')
        return (
            <>
                {
                    output.map((seg, idx) => {
                        return (
                            <button onClick={() => handleClick(seg.path)}>
                                {seg.name}
                            </button>
                        )
                    })
                }
            </>
        )

    const itemSplit = output.split("\n");

    const regexp = new RegExp(searchText.toLowerCase());
    const filteredItems = itemSplit.filter(seg => regexp.test(seg.toLowerCase()));
    return (
        <>
            {
                filteredItems.map((seg, idx) => {
                    seg = seg.trim();
                    if (!seg) return null;
                    const path = item + (item === '/' ? '' : '/') + seg;
                    return (
                        <button onClick={() => handleClick(path)}>
                            {seg}
                        </button>
                    )
                })
            }
        </>
    )
}

function titleRend(item, handleClick) {
    let itemSplit = item.split('/');
    if (item === '/') itemSplit.pop();
    return <>
        <div className="button-group">
            {
                itemSplit.map((seg, idx) => {
                    const path = '/' + itemSplit.slice(1, idx + 1).join('/');
                    if (idx === 0) {
                        seg = 'root';
                    }
                    return (
                        <>
                            <button onClick={() => handleClick(path)}>
                                {seg}
                            </button>
                            <label>/</label>
                        </>
                    )
                })
            }
        </div>

    </>
}

function optional(opt, item, refresh) {
    console.log("[optional] ", opt, item);
    window.electron.ipcRenderer.invoke('optional', opt, item).then(() => {
        refresh();
        console.log("[refreshKey] ");
    });
}

export default function Home() {
    const [searchParams, setSearchParams] = useSearchParams();
    const item = searchParams.get('item') || init;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sortOption, setSortOption] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');

    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = () => {
        console.log("[refresh] ok! ");
        setRefreshKey(prev => prev + 1);
    };

    const handleClick = (name) => {
        setSearchParams({ item: name });
        setAppliedSearch('');
    };

    const handleSortChange = (newSortOption, newSortOrder) => {
        console.log('정렬 옵션 변경:', newSortOption, newSortOrder);
        setSortOption(newSortOption);
        setSortOrder(newSortOrder);
    };

    const handleSearch = (text) => {
        setAppliedSearch(text);
    };

    const handleSidebarOpenChange = (open) => {
        setSidebarOpen(open);
    };


    return (
        <div className="container">
            <Sidebar
                onSortChange={handleSortChange}
                onSearch={handleSearch}
                searchText={searchInput}
                setSearchText={setSearchInput}
                onOpenChange={handleSidebarOpenChange}
            >
                <div className="button-group">
                    {renderPath(init, handleClick, refreshKey, sortOption, sortOrder, '*')}
                </div>
            </Sidebar>
            <div className="box2">
                <div className="title">
                    {item === '-initStorage' ? '저장소 선택' : titleRend(item, handleClick)}
                </div>
                <div className="box">
                    <div></div>
                    <div className="button-group">
                        {renderPath(item, handleClick, refreshKey, sortOption, sortOrder, appliedSearch || '')}
                    </div>
                    <div></div>

                </div>
                <div></div>
                <div className={!sidebarOpen ? "footer-notvis" : "button-group footer-buttons"}>
                    <button onClick={() => optional('download', item, refresh)}>다운로드</button>
                    <button onClick={() => optional('load', item, refresh)}>업로드</button>
                    <button onClick={() => optional('remove', item, refresh)}>삭제</button>
                    <button onClick={() => optional('favorite', item, refresh)}>즐겨찾기</button>
                    <button onClick={() => optional('removefavorite', item, refresh)}>즐겨찾기삭제</button>
                </div>
            </div>


        </div>
    );
}
