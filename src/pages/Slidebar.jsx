import { useState, useEffect } from 'react';
import './Sliderbar.css';

export default function Sidebar({ children, onSortChange, onSearch, onOpenChange, refreshSignal }) {
    const [open, setOpen] = useState(false);
    const [sortOption, setSortOption] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc'); // asc 또는 desc
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        if (onOpenChange) onOpenChange(open);
    }, [open, onOpenChange]);

    const handleSortChange = (e) => {
        const newSortOption = e.target.value;
        setSortOption(newSortOption);
        if (onSortChange) {
            onSortChange(newSortOption, sortOrder);
        }
    };



    const handleOrderChange = () => {
        const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        setSortOrder(newOrder);
        if (onSortChange) {
            onSortChange(sortOption, newOrder);
        }
    };

    const handleSearch = () => {
        if (onSearch) {
            onSearch(searchText);
        }
    };

    return (
        <div className="app-container">
            <div className={`sidebar ${open ? 'open' : 'closed'}`}>
                <button className="toggle-btn" onClick={() => setOpen(!open)}>
                    {open ? '◀' : '▶'}
                </button>
                {open && (
                    <nav>

                        <div className="sort-section">
                            <h3>정렬 옵션</h3>
                            <div className="sort-controls">
                                <select
                                    value={sortOption}
                                    onChange={handleSortChange}
                                    className="sort-select"
                                >
                                    <option value="name">이름순</option>
                                    <option value="date">날짜순</option>
                                    <option value="size">크기순</option>
                                    <option value="type">타입순</option>
                                </select>
                                <button
                                    className="order-toggle"
                                    onClick={handleOrderChange}
                                    title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
                                >
                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                </button>
                            </div>
                        </div>


                        <div className="search-section">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="파일 이름 검색"
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                            />
                            <button className="search-btn" onClick={handleSearch}>검색</button>
                        </div>

                        {children}
                    </nav>
                )}
            </div>
        </div>
    );
}
