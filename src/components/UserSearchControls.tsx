const UserSearchControls = () => {
    return (
        <div style={styles.searchContainer}>
            <div style={styles.pageControls}>
                <button style={styles.pageButton}>{`<<`}</button>
                <button style={styles.pageButton}>{`<`}</button>
                <input type="number" style={styles.pageInput}/>
                <button style={styles.pageButton}>{`>`}</button>
                <button style={styles.pageButton}>{`>>`}</button>
            </div >
            <div style={styles.pageControls}>
                <h3 style={styles.label}>Rows per page:</h3>
                <select style={styles.pageInput}>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                </select>
            </div>
            <div style={styles.pageControls}>
                <h3 style={styles.label}>Search:</h3>
                <input type="text" placeholder="Search by name or email" style={{...styles.pageInput,...styles.searchInput}} />
            </div>
        </div>
    );
}
export default UserSearchControls;

const styles: {[key: string]: React.CSSProperties} = {
    searchContainer: {
        display: "flex",
        flexDirection: "row",
    },
    pageControls: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderRight: "3px solid #9D9D9D",
        paddingBlock: "10px",
        paddingRight: "40px",
        paddingLeft: "10px",
        textWrap: "nowrap",
    },
    pageButton: {
        border: "none",
        backgroundColor: 'transparent',
        fontSize: "24px",
        marginInline: "10px",
    },
    pageInput: {
        width: "50px",
        height: "30px",
        fontFamily: 'inter',
    },
    searchInput: {
        width: "200px",
        height: "30px",
        fontFamily: 'inter',
        marginInline: "10px",
    },
    label: {
        fontFamily: 'inter',
        marginInline: "10px",
        marginBlock: "0px",
       
    }
}